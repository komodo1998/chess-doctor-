// Analysis pipeline: PGN → Stockfish → structured per-move analysis →
// pattern detection → critical positions. Depth and thresholds come from config.

import { Chess } from 'chess.js';
import type { StockfishEngine } from './engine';
import { MATE_CAP } from './engine';
import { DEFAULT_CONFIG, type DoctorConfig } from './config';
import { moveAccuracy } from './accuracy';
import { detectPatterns } from './patterns';
import { detectCriticalPlies } from './critical';
import { isTacticalContext, detectPhase } from './boardFacts';
import type {
  Color,
  EngineEval,
  GameAnalysis,
  GameInfo,
  MoveAnalysis,
  MoveClassification,
  PlyRecord,
} from './types';

export interface AnalysisProgress {
  gameLabel: string;
  gameIndex: number;
  gameCount: number;
  ply: number;
  plies: number;
}

export class CancelledError extends Error {
  constructor() {
    super('cancelled');
  }
}

const CPL_CAP = 1000;

export function classifyMove(cpl: number, config: DoctorConfig): MoveClassification {
  if (cpl <= 10) return 'best';
  if (cpl <= config.classification.excellent) return 'excellent';
  if (cpl <= config.classification.good) return 'good';
  if (cpl <= config.classification.inaccuracy) return 'inaccuracy';
  if (cpl <= config.classification.mistake) return 'mistake';
  return 'blunder';
}

/** Centipawn loss from the mover's perspective, with mate-awareness. */
export function computeCpl(
  beforeWhite: number,
  afterWhite: number,
  moverWhite: boolean,
  mateInBefore: number | null,
  mateInAfter: number | null
): number {
  const beforeMover = moverWhite ? beforeWhite : -beforeWhite;
  const afterMover = moverWhite ? afterWhite : -afterWhite;
  // Mate scores are stored from White's POV — flip them for the mover before
  // comparing, so "Black correctly defends against White's mate" is a good
  // move instead of a catastrophe.
  const mateMover = (mateIn: number | null): number | null =>
    mateIn === null ? null : moverWhite ? mateIn : -mateIn;
  const mateBefore = mateMover(mateInBefore);
  const mateAfter = mateMover(mateInAfter);

  const hadMate = mateBefore !== null && mateBefore > 0;
  const stillMate = mateAfter !== null && mateAfter > 0;
  const wasMated = mateBefore !== null && mateBefore < 0;
  const stillMated = mateAfter !== null && mateAfter < 0;

  // Had a forced mate and no longer does → catastrophic.
  if (hadMate && !stillMate) return 900;
  // Still getting mated → no further loss.
  if (wasMated && stillMated) return 0;
  // Escaped a mate → good move (will be classified via cpl 0).
  if (wasMated && !stillMated) return 0;

  const loss = beforeMover - afterMover;
  return Math.max(0, Math.min(CPL_CAP, Math.round(loss)));
}

function uciOf(san: string, fen: string): string | null {
  try {
    const c = new Chess(fen);
    const m = c.move(san);
    return m ? m.from + m.to + (m.promotion ?? '') : null;
  } catch {
    return null;
  }
}

function sanOfUci(uci: string, fen: string): string {
  if (!uci) return '';
  try {
    const c = new Chess(fen);
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
    return m?.san ?? uci;
  } catch {
    return uci;
  }
}

function pvToSan(pvUci: string[], fen: string, maxPlies = 6): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const uci of pvUci.slice(0, maxPlies)) {
    try {
      const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
      if (!m) break;
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}

function metricsForColor(moves: MoveAnalysis[], color: Color) {
  const mine = moves.filter((m) => m.color === color);
  if (mine.length === 0) {
    return {
      moves: 0, avgCpl: 0, blunders: 0, mistakes: 0, inaccuracies: 0, accuracy: 0,
      openingAccuracy: null, middlegameAccuracy: null, endgameAccuracy: null,
      tacticalAccuracy: null, strategicAccuracy: null, timeTrouble: false,
    };
  }
  const accs = mine.map((m) => m.accuracy);
  const byPhase = (phase: string) => {
    const xs = mine.filter((m) => m.phase === phase).map((m) => m.accuracy);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const tactical = mine.filter((m) => m.tacticalContext).map((m) => m.accuracy);
  const strategic = mine.filter((m) => !m.tacticalContext && m.phase !== 'opening').map((m) => m.accuracy);
  const lastTen = mine.slice(-10);
  const timeTroubleMoves = lastTen.filter((m) => m.secondsSpent !== undefined && m.secondsSpent < 30).length;

  return {
    moves: mine.length,
    avgCpl: mine.reduce((a, m) => a + m.cpl, 0) / mine.length,
    blunders: mine.filter((m) => m.classification === 'blunder').length,
    mistakes: mine.filter((m) => m.classification === 'mistake').length,
    inaccuracies: mine.filter((m) => m.classification === 'inaccuracy').length,
    accuracy: accs.reduce((a, b) => a + b, 0) / accs.length,
    openingAccuracy: byPhase('opening'),
    middlegameAccuracy: byPhase('middlegame'),
    endgameAccuracy: byPhase('endgame'),
    tacticalAccuracy: tactical.length ? tactical.reduce((a, b) => a + b, 0) / tactical.length : null,
    strategicAccuracy: strategic.length ? strategic.reduce((a, b) => a + b, 0) / strategic.length : null,
    timeTrouble: timeTroubleMoves >= 4,
  };
}

export class AnalysisPipeline {
  private config: DoctorConfig;
  private cancelled = false;

  constructor(private engine: StockfishEngine, config: DoctorConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  cancel() {
    this.cancelled = true;
    this.engine.cancel();
  }

  /** Analyze a single parsed game. Throws CancelledError if cancelled. */
  async analyzeGame(
    parsed: { startFen: string; plies: PlyRecord[] },
    info: GameInfo,
    id: string,
    onProgress: (p: AnalysisProgress) => void,
    gameIndex: number,
    gameCount: number,
    gameLabel: string
  ): Promise<GameAnalysis> {
    this.cancelled = false;
    const plies = parsed.plies;
    if (plies.length === 0) throw new Error('Game has no moves.');

    // Positions to analyze: fenBefore of each ply + the final position.
    const fens: string[] = [parsed.startFen];
    for (const p of plies) fens.push(p.fenAfter);

    const evals: (EngineEval | null)[] = [];
    for (let i = 0; i < fens.length; i++) {
      if (this.cancelled) throw new CancelledError();
      onProgress({ gameLabel, gameIndex, gameCount, ply: i, plies: fens.length });
      try {
        const e = await this.engine.analyze(fens[i], {
          depth: this.config.depth,
          timeoutMs: this.config.perPositionTimeoutMs,
        });
        evals.push(e);
      } catch (err) {
        if ((err as Error).message === 'cancelled' || this.cancelled) throw new CancelledError();
        evals.push(null); // keep going with a hole; classify conservatively below
      }
    }

    // Terminal positions (mate delivered / stalemate / dead draw) return no
    // engine info, which would read as "eval 0" — patch them with the truth.
    for (let i = 0; i < fens.length; i++) {
      const fen = fens[i];
      try {
        const c = new Chess(fen);
        if (c.isCheckmate()) {
          const turnWhite = (fen.split(' ')[1] ?? 'w') === 'w';
          evals[i] = {
            fen,
            depth: 0,
            bestMoveUci: '',
            cpWhite: turnWhite ? -MATE_CAP : MATE_CAP,
            mateIn: turnWhite ? -1 : 1,
            pvUci: [],
            lines: [],
          };
        } else if (c.isStalemate() || c.isInsufficientMaterial()) {
          evals[i] = { fen, depth: 0, bestMoveUci: '', cpWhite: 0, mateIn: null, pvUci: [], lines: [] };
        }
      } catch {
        /* unparseable FEN — keep the engine's result */
      }
    }

    const moves: MoveAnalysis[] = [];
    for (let i = 0; i < plies.length; i++) {
      const plyRec = plies[i];
      const before = evals[i];
      const after = evals[i + 1];
      const moverWhite = plyRec.color === 'white';

      let evalBeforeWhite = before?.cpWhite ?? 0;
      let evalAfterWhite = after?.cpWhite ?? evalBeforeWhite;
      const mateInBefore = before?.mateIn ?? null;
      const mateInAfter = after?.mateIn ?? null;

      const bestMoveUci = before?.bestMoveUci ?? '';
      const playedUci = plyRec.uci;
      const playedIsBest =
        bestMoveUci !== '' && normalizeUci(bestMoveUci) === normalizeUci(playedUci);

      let cpl = playedIsBest
        ? 0
        : computeCpl(evalBeforeWhite, evalAfterWhite, moverWhite, mateInBefore, mateInAfter);
      if (!before || !after) cpl = Math.min(cpl, 60); // missing engine data — never cry wolf

      const classification: MoveClassification = playedIsBest ? 'best' : classifyMove(cpl, this.config);
      const bestMoveSan = playedIsBest ? plyRec.san : sanOfUci(bestMoveUci, plyRec.fenBefore);

      moves.push({
        ply: plyRec.ply,
        moveNumber: plyRec.moveNumber,
        color: plyRec.color,
        san: plyRec.san,
        uci: playedUci,
        fenBefore: plyRec.fenBefore,
        fenAfter: plyRec.fenAfter,
        phase: detectPhase(plyRec.fenBefore),
        classification,
        cpl,
        evalBeforeWhite,
        evalAfterWhite,
        bestMoveUci,
        bestMoveSan,
        pvSan: before ? pvToSan(before.pvUci, plyRec.fenBefore) : [],
        capture: plyRec.capture,
        check: plyRec.check,
        secondsSpent: plyRec.secondsSpent,
        tacticalContext: isTacticalContext(plyRec.fenBefore),
        patterns: [],
        accuracy: moveAccuracy(
          moverWhite ? evalBeforeWhite : -evalBeforeWhite,
          moverWhite ? evalAfterWhite : -evalAfterWhite
        ),
      });
    }

    const instances = detectPatterns(moves, id, this.config);
    for (const inst of instances) {
      const mv = moves[inst.ply - 1];
      if (mv && !mv.patterns.includes(inst.patternId)) mv.patterns.push(inst.patternId);
    }
    const criticalPlies = detectCriticalPlies(moves, instances, this.config);

    return {
      id,
      importedAt: Date.now(),
      analyzedAt: Date.now(),
      engine: { name: this.engine.displayName, depth: this.config.depth },
      info,
      startFen: parsed.startFen,
      moves,
      instances,
      criticalPlies,
      metrics: { white: metricsForColor(moves, 'white'), black: metricsForColor(moves, 'black') },
    };
  }
}

export function normalizeUci(uci: string): string {
  return uci.length === 5 ? uci.slice(0, 4) + uci[4].toLowerCase() : uci;
}

export { sanOfUci, uciOf };
