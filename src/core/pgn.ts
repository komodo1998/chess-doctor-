// GameImporter / PGNParser — robust multi-game PGN ingestion.

import { Chess } from 'chess.js';
import type { Color, GameInfo, PlyRecord } from './types';

export interface ParsedGame {
  info: Omit<GameInfo, 'playerColor' | 'playerElo' | 'resultForPlayer'>;
  startFen: string;
  plies: PlyRecord[];
  /** Raw movetext, kept for %clk pairing checks and debugging. */
  movetext: string;
}

export interface PgnParseResult {
  games: ParsedGame[];
  errors: string[];
}

interface RawChunk {
  tags: string;
  movetext: string;
}

function splitChunks(text: string): RawChunk[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const chunks: RawChunk[] = [];
  let current: RawChunk | null = null;
  let sawMoves = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('[') && line.endsWith(']') && !line.startsWith('[%')) {
      if (sawMoves) {
        if (current) chunks.push(current);
        current = { tags: line + '\n', movetext: '' };
        sawMoves = false;
      } else {
        if (!current) current = { tags: '', movetext: '' };
        current.tags += line + '\n';
      }
    } else if (line.length > 0) {
      if (!current) current = { tags: '', movetext: '' };
      current.movetext += line + '\n';
      sawMoves = true;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function headerValue(headers: Record<string, string>, key: string): string | undefined {
  const v = headers[key];
  // PGN fills unknown values with '?' markers ("?", "????.??.??"); '-' means
  // unlimited time control. Treat all of these as absent.
  if (!v || v === '' || /^[?.-]+$/.test(v)) return undefined;
  return v;
}

function eloOf(headers: Record<string, string>, key: string): number | undefined {
  const v = headers[key];
  if (!v || v === '?' || v === '') return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function timeControlKind(tc: string | undefined): GameInfo['timeControlKind'] {
  if (!tc) return 'unknown';
  // e.g. "600+5", "180", "90+30", "-" for unlimited
  const base = parseInt(tc.split('+')[0], 10);
  if (!Number.isFinite(base)) return 'unknown';
  const minutes = base / 60;
  if (minutes < 3) return 'bullet';
  if (minutes < 10) return 'blitz';
  if (minutes < 60) return 'rapid';
  return 'classical';
}

/** Extract per-move elapsed time from %clk comments. Returns null if pairing is unreliable. */
function extractClocks(movetext: string, plyCount: number): (number | undefined)[] | null {
  const re = /%clk\s+(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)/g;
  const clocks: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(movetext)) !== null) {
    clocks.push(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
  }
  if (clocks.length !== plyCount) return null;
  const elapsed: (number | undefined)[] = [];
  // Elapsed = same player's previous clock minus current (plies alternate colors,
  // so the comparison is always i-2 → i). The first two moves have no baseline.
  for (let i = 0; i < clocks.length; i++) {
    if (i < 2) {
      elapsed.push(undefined);
      continue;
    }
    const d = clocks[i - 2] - clocks[i];
    elapsed.push(d >= 0 && d < 3600 ? Math.round(d) : undefined);
  }
  return elapsed;
}

function parseSingleChunk(chunk: RawChunk): ParsedGame {
  const pgnText = chunk.tags + '\n' + chunk.movetext;
  const chess = new Chess();
  try {
    chess.loadPgn(pgnText);
  } catch {
    chess.loadPgn(pgnText, { strict: false });
  }

  const headers: Record<string, string> =
    typeof chess.getHeaders === 'function' ? chess.getHeaders() : (chess as unknown as { header(): Record<string, string> }).header();

  const fenHeader = headerValue(headers, 'FEN');
  const startFen = fenHeader ?? new Chess().fen();

  // Replay to capture per-ply FENs (chess.js `after` fields are reliable, but we
  // rebuild defensively so partial PGNs still produce a full position list).
  const replay = new Chess(startFen);
  const history = chess.history({ verbose: true });
  const plies: PlyRecord[] = [];

  for (let i = 0; i < history.length; i++) {
    const hm = history[i];
    const fenBefore = replay.fen();
    const move = replay.move({ from: hm.from, to: hm.to, promotion: hm.promotion ?? 'q' });
    if (!move) throw new Error(`Illegal move ${i + 1}: ${hm.san}`);
    const color: Color = move.color === 'w' ? 'white' : 'black';
    plies.push({
      ply: i + 1,
      moveNumber: Math.floor(i / 2) + 1,
      color,
      san: move.san,
      uci: move.from + move.to + (move.promotion ?? ''),
      fenBefore,
      fenAfter: replay.fen(),
      capture: Boolean(move.captured),
      check: Boolean(move.san.includes('+') || move.san.includes('#')),
    });
  }

  const clocks = extractClocks(chunk.movetext, plies.length);
  if (clocks) {
    for (let i = 0; i < plies.length; i++) {
      const s = clocks[i];
      if (s !== undefined) plies[i].secondsSpent = s;
    }
  }

  const info: Omit<GameInfo, 'playerColor' | 'playerElo' | 'resultForPlayer'> = {
    white: headers.White ?? 'White',
    black: headers.Black ?? 'Black',
    whiteElo: eloOf(headers, 'WhiteElo'),
    blackElo: eloOf(headers, 'BlackElo'),
    result: headers.Result ?? '*',
    date: headerValue(headers, 'UTCDate') ?? headerValue(headers, 'Date'),
    event: headerValue(headers, 'Event'),
    timeControl: headerValue(headers, 'TimeControl'),
    timeControlKind: timeControlKind(headerValue(headers, 'TimeControl')),
    eco: headerValue(headers, 'ECO'),
    opening: headerValue(headers, 'Opening') ?? headerValue(headers, 'Variation'),
    termination: headerValue(headers, 'Termination'),
  };

  return { info, startFen, plies, movetext: chunk.movetext };
}

export function parsePgn(text: string): PgnParseResult {
  const errors: string[] = [];
  const games: ParsedGame[] = [];
  const chunks = splitChunks(text);
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (!c.movetext.trim() && !c.tags.trim()) continue;
    try {
      const g = parseSingleChunk(c);
      if (g.plies.length === 0) {
        errors.push(`Game ${i + 1}: no moves found.`);
        continue;
      }
      games.push(g);
    } catch (e) {
      const white = /\[White\s+"([^"]*)"/.exec(c.tags)?.[1];
      const black = /\[Black\s+"([^"]*)"/.exec(c.tags)?.[1];
      const label = white || black ? `${white ?? '?'} – ${black ?? '?'}` : `Game ${i + 1}`;
      errors.push(`${label}: ${(e as Error).message}`);
    }
  }
  return { games, errors };
}

/** If exactly one player name appears in every game, that's almost certainly the user. */
export function suggestPlayerName(games: ParsedGame[]): string | null {
  if (games.length === 0) return null;
  const candidates = new Map<string, number>();
  for (const g of games) {
    const names = new Set([g.info.white, g.info.black]);
    for (const n of names) candidates.set(n, (candidates.get(n) ?? 0) + 1);
  }
  for (const [name, count] of candidates) {
    if (count === games.length && name !== 'White' && name !== 'Black' && !name.startsWith('Anonymous')) {
      return name;
    }
  }
  return null;
}

export function gameLabel(info: GameInfo): string {
  const white = info.white;
  const black = info.black;
  const eco = info.eco ? ` · ${info.eco}` : '';
  return `${white} – ${black}${eco}`;
}
