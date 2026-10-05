// EngineAnalyzer — Stockfish 19 NNUE (WASM) driven over UCI in a Web Worker.
// The binary is the official stockfish.js 19 build (universal: SIMD/feature
// detection happens at runtime, and the SFNNv16 NNUE net is embedded in the
// wasm — no external EvalFile). The multi-threaded build is used when the page
// is cross-origin isolated (SharedArrayBuffer available); otherwise we fall
// back to the single-threaded build of the same engine. The engine is the
// single source of chess truth; everything downstream only annotates it.

import type { Color, EngineEval, EngineLine } from './types';

/** Centipawn value used for mate scores (cpWhite = ±(MATE_CAP − mateIn)). */
export const MATE_CAP = 100000;

const MULTI_THREAD_BUILD = '/engines/stockfish-19.js';
const SINGLE_THREAD_BUILD = '/engines/stockfish-19-single.js';

/** True when the browser allows pthreads (cross-origin isolation + SAB). */
export function threadsAvailable(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true
  );
}

/** Engine worker threads: all but one core, capped for sanity. */
export function engineThreads(): number {
  const cores = navigator.hardwareConcurrency ?? 2;
  return Math.max(1, Math.min(cores - 1, 12));
}

interface PendingRequest {
  fen: string;
  turnWhite: boolean;
  resolve: (e: EngineEval) => void;
  reject: (err: Error) => void;
  depthWanted: number;
  timeoutAt: number;
  stopped: boolean;
  /** Guards against a stale bestmove from a cancelled search resolving a newer request. */
  seq: number;
}

function cpFromScore(cp: number, turnWhite: boolean): number {
  // engine reports from side-to-move perspective
  return turnWhite ? cp : -cp;
}

function mateScore(mate: number, turnWhite: boolean): { cpWhite: number; mateIn: number | null } {
  // mate > 0: side to move mates in N
  const whiteMating = turnWhite ? mate > 0 : mate < 0;
  const n = Math.abs(mate);
  return {
    cpWhite: whiteMating ? MATE_CAP - n : -(MATE_CAP - n),
    mateIn: whiteMating ? n : -n,
  };
}

export class StockfishEngine {
  private worker: Worker;
  private pending: PendingRequest | null = null;
  private lines = new Map<number, EngineLine>();
  private initResolve: (() => void) | null = null;
  private initReject: ((err: Error) => void) | null = null;
  private ready = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private seq = 0;
  private readonly threaded: boolean;
  /** Engine's own "id name" string (e.g. "Stockfish 19 …"), when reported. */
  private idName: string | null = null;

  private constructor(worker: Worker, threaded: boolean) {
    this.worker = worker;
    this.threaded = threaded;
    worker.onmessage = (ev: MessageEvent<string>) => this.onLine(String(ev.data));
    worker.onerror = (ev) => {
      const err = new Error(`Engine worker error: ${ev.message ?? 'unknown'}`);
      if (this.initReject) {
        this.initReject(err);
        this.initReject = null;
      }
      this.clearTimer();
      const p = this.pending;
      this.pending = null;
      p?.reject(err);
    };
  }

  /** Boot the engine: wait for uciok + readyok. */
  static async create(): Promise<StockfishEngine> {
    const threaded = threadsAvailable();
    const worker = new Worker(threaded ? MULTI_THREAD_BUILD : SINGLE_THREAD_BUILD);
    const engine = new StockfishEngine(worker, threaded);
    await engine.init();
    return engine;
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.initResolve = resolve;
      this.initReject = reject;
      this.send('uci');
      setTimeout(() => {
        if (!this.ready) reject(new Error('Engine failed to initialise within 30s.'));
      }, 30000);
    });
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  private onLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('id name ')) {
      this.idName = trimmed.slice('id name '.length);
      return;
    }

    if (trimmed === 'uciok') {
      if (this.threaded) {
        this.send(`setoption name Threads value ${engineThreads()}`);
      }
      this.send('setoption name Hash value 256');
      // The SF19 wasm ships with the NNUE net embedded — no EvalFile needed.
      this.send('isready');
      return;
    }
    if (trimmed === 'readyok') {
      this.ready = true;
      if (this.initResolve) {
        this.initResolve();
        this.initResolve = null;
        this.initReject = null;
      }
      return;
    }

    const pending = this.pending;
    if (!pending) return;

    if (trimmed.startsWith('info') && trimmed.includes(' pv ')) {
      this.parseInfo(trimmed);
      return;
    }
    if (trimmed.startsWith('bestmove')) {
      const p = this.pending;
      if (p && p.seq !== this.seq) return; // stale bestmove from a cancelled search
      this.clearTimer();
      this.pending = null;
      if (!p) return;
      if (p.stopped) {
        // cancellation: the stop was already handled via reject; nothing to do
        return;
      }
      const best = this.buildEval(p);
      p.resolve(best);
      return;
    }
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private parseInfo(line: string) {
    const pending = this.pending;
    if (!pending) return;
    const tokens = line.split(/\s+/);
    let depth = 0;
    let multipv = 1;
    let cp: number | null = null;
    let mate: number | null = null;
    let pv: string[] | null = null;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === 'depth') depth = Number(tokens[++i]);
      else if (t === 'multipv') multipv = Number(tokens[++i]);
      else if (t === 'score') {
        const kind = tokens[++i];
        const val = Number(tokens[++i]);
        if (kind === 'cp') cp = val;
        else if (kind === 'mate') mate = val;
      } else if (t === 'pv') {
        pv = tokens.slice(i + 1).filter((x) => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(x));
        break;
      }
    }
    if (!pv || pv.length === 0) return;
    if (tokens.includes('lowerbound') || tokens.includes('upperbound')) return;

    const prev = this.lines.get(multipv);
    if (prev && prev.depth > depth) return; // stale, lower depth than what we already have

    let cpWhite: number;
    let mateIn: number | null = null;
    if (mate !== null) {
      const m = mateScore(mate, pending.turnWhite);
      cpWhite = m.cpWhite;
      mateIn = m.mateIn;
    } else if (cp !== null) {
      cpWhite = cpFromScore(cp, pending.turnWhite);
    } else {
      return;
    }

    this.lines.set(multipv, { multipv, depth, cpWhite, mateIn, pvUci: pv });
  }

  private buildEval(p: PendingRequest): EngineEval {
    const lines = [...this.lines.values()].filter((l) => l.pvUci.length > 0);
    lines.sort((a, b) => a.multipv - b.multipv);
    const best = lines[0];
    if (!best) {
      // No info captured (e.g. instant bestmove on a terminal position).
      return {
        fen: p.fen,
        depth: 0,
        bestMoveUci: '',
        cpWhite: 0,
        mateIn: null,
        pvUci: [],
        lines: [],
      };
    }
    return {
      fen: p.fen,
      depth: best.depth,
      bestMoveUci: best.pvUci[0] ?? '',
      cpWhite: best.cpWhite,
      mateIn: best.mateIn,
      pvUci: best.pvUci,
      lines,
    };
  }

  /** Analyze one position to a fixed depth. Resolves with the engine's evaluation. */
  async analyze(fen: string, opts: { depth: number; timeoutMs?: number }): Promise<EngineEval> {
    if (!this.ready) throw new Error('Engine not ready');
    if (this.pending) throw new Error('Engine is busy');
    const parts = fen.split(' ');
    const turnWhite = (parts[1] ?? 'w') === 'w';
    const mySeq = ++this.seq;
    return new Promise<EngineEval>((resolve, reject) => {
      this.lines.clear();
      const timeoutMs = opts.timeoutMs ?? 30000;
      this.pending = {
        fen,
        turnWhite,
        resolve,
        reject,
        depthWanted: opts.depth,
        timeoutAt: Date.now() + timeoutMs,
        stopped: false,
        seq: mySeq,
      };
      this.send(`position fen ${fen}`);
      this.send(`go depth ${opts.depth}`);
      this.timer = setInterval(() => {
        if (this.pending && Date.now() > this.pending.timeoutAt) {
          this.send('stop'); // engine will emit bestmove; we resolve with best-so-far
        }
      }, 500);
    });
  }

  /** Cancel the current analysis; its promise rejects. */
  cancel(): void {
    const p = this.pending;
    if (!p) return;
    p.stopped = true;
    this.send('stop');
    this.clearTimer();
    this.pending = null;
    p.reject(new Error('cancelled'));
  }

  newGame(): void {
    this.send('ucinewgame');
  }

  destroy(): void {
    try {
      this.send('quit');
      this.worker.terminate();
    } catch {
      /* ignore */
    }
    this.clearTimer();
    this.ready = false;
  }

  /** Human-facing engine identity for stored analyses. */
  get displayName(): string {
    const base = this.idName?.split(/\s+/).slice(0, 2).join(' ') ?? 'Stockfish 19';
    return `${base} NNUE (WASM)`;
  }

  /** Mate in N from White's POV, if any. */
  static isMateFor(mateIn: number | null, color: Color): boolean {
    if (mateIn === null) return false;
    return color === 'white' ? mateIn > 0 : mateIn < 0;
  }
}

/** Singleton accessor — one engine instance for the whole app. */
let enginePromise: Promise<StockfishEngine> | null = null;

export function getEngine(): Promise<StockfishEngine> {
  if (!enginePromise) {
    enginePromise = StockfishEngine.create().catch((err) => {
      enginePromise = null;
      throw err;
    });
  }
  return enginePromise;
}
