// Pure, FEN-based position facts used by the pattern detector.
// Deliberately independent from chess.js so every rule here is testable and
// cheap enough to run for every position of every game.

import type { GamePhase } from './types';

export type PieceChar = 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';

export interface Board {
  /** grid[row][file]; row 0 = rank 8, file 0 = a-file. */
  grid: (PieceChar | null)[][];
}

export const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3.25,
  r: 5,
  q: 9,
  k: 0,
};

export function isWhitePiece(pc: PieceChar): boolean {
  return pc === pc.toUpperCase();
}

export function pieceType(pc: string): string {
  return pc.toLowerCase();
}

export function parseFen(fen: string): Board {
  const boardPart = fen.split(' ')[0];
  const rows = boardPart.split('/');
  const grid: (PieceChar | null)[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: (PieceChar | null)[] = [];
    const rowStr = rows[r] ?? '8';
    let file = 0;
    for (const ch of rowStr) {
      if (/[1-8]/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) row.push(null);
        file += Number(ch);
      } else if ('pnbrqkPNBRQK'.includes(ch)) {
        row.push(ch as PieceChar);
        file++;
      }
    }
    while (row.length < 8) row.push(null);
    grid.push(row);
  }
  return { grid };
}

export function sqToIndices(sq: string): [number, number] {
  // 'e4' → [row, file]: row = 8 - rank, file = a1=0..
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]);
  return [8 - rank, file];
}

export function indicesToSq(row: number, file: number): string {
  return String.fromCharCode(97 + file) + String(8 - row);
}

export function pieceAt(b: Board, sq: string): PieceChar | null {
  const [r, f] = sqToIndices(sq);
  if (r < 0 || r > 7 || f < 0 || f > 7) return null;
  return b.grid[r][f];
}

function inBoard(r: number, f: number): boolean {
  return r >= 0 && r <= 7 && f >= 0 && f <= 7;
}

const KNIGHT_OFFSETS: [number, number][] = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const KING_OFFSETS: [number, number][] = [
  [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1],
];
const ORTHO_DIRS: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAG_DIRS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** All squares holding pieces of `byWhite` that attack `sq`. */
export function attackersOf(b: Board, sq: string, byWhite: boolean): string[] {
  const [r, f] = sqToIndices(sq);
  const out: string[] = [];
  const push = (rr: number, ff: number) => {
    if (inBoard(rr, ff) && b.grid[rr][ff]) out.push(indicesToSq(rr, ff));
  };

  // Pawns: a white pawn on (r+1, f±1) attacks (r, f); a black pawn on (r-1, f±1) attacks (r, f).
  const pawnRow = byWhite ? r + 1 : r - 1;
  for (const df of [-1, 1]) {
    if (inBoard(pawnRow, f + df)) {
      const pc = b.grid[pawnRow][f + df];
      if (pc && isWhitePiece(pc) === byWhite && pieceType(pc) === 'p') out.push(indicesToSq(pawnRow, f + df));
    }
  }

  for (const [dr, df] of KNIGHT_OFFSETS) {
    const rr = r + dr, ff = f + df;
    if (inBoard(rr, ff)) {
      const pc = b.grid[rr][ff];
      if (pc && isWhitePiece(pc) === byWhite && pieceType(pc) === 'n') out.push(indicesToSq(rr, ff));
    }
  }
  for (const [dr, df] of KING_OFFSETS) {
    const rr = r + dr, ff = f + df;
    if (inBoard(rr, ff)) {
      const pc = b.grid[rr][ff];
      if (pc && isWhitePiece(pc) === byWhite && pieceType(pc) === 'k') out.push(indicesToSq(rr, ff));
    }
  }
  for (const dirs of [ORTHO_DIRS, DIAG_DIRS]) {
    for (const [dr, df] of dirs) {
      let rr = r + dr, ff = f + df;
      while (inBoard(rr, ff)) {
        const pc = b.grid[rr][ff];
        if (pc) {
          const t = pieceType(pc);
          if (isWhitePiece(pc) === byWhite && (t === 'q' || (dirs === ORTHO_DIRS ? t === 'r' : t === 'b'))) {
            out.push(indicesToSq(rr, ff));
          }
          break;
        }
        rr += dr;
        ff += df;
      }
    }
  }
  return out;
}

export function isAttacked(b: Board, sq: string, byWhite: boolean): boolean {
  return attackersOf(b, sq, byWhite).length > 0;
}

export interface HangingPiece {
  sq: string;
  piece: PieceChar;
  /** Net material the opponent wins by capturing here (pawns). */
  gain: number;
  defended: boolean;
}

/** Pieces of `colorWhite` that the opponent can profitably capture right now. */
export function hangingPieces(b: Board, colorWhite: boolean, minGain = 1.5): HangingPiece[] {
  const out: HangingPiece[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isWhitePiece(pc) !== colorWhite || pieceType(pc) === 'k') continue;
      const sq = indicesToSq(r, f);
      const attackers = attackersOf(b, sq, !colorWhite);
      if (attackers.length === 0) continue;
      const defenders = attackersOf(b, sq, colorWhite);
      const value = PIECE_VALUE[pieceType(pc)];
      let gain: number;
      let defended: boolean;
      if (defenders.length === 0) {
        gain = value;
        defended = false;
      } else {
        const minAttacker = Math.min(...attackers.map((a) => PIECE_VALUE[pieceType(pieceAt(b, a) as PieceChar)] || 0));
        gain = value - minAttacker;
        defended = true;
      }
      if (gain >= minGain) out.push({ sq, piece: pc, gain, defended });
    }
  }
  return out;
}

export interface MaterialCount {
  pawns: number;
  minors: number;
  rooks: number;
  queens: number;
  /** Total points excluding kings and pawns. */
  nonPawnPoints: number;
  totalPoints: number; // including pawns, excluding kings
}

export function materialFor(b: Board, colorWhite: boolean): MaterialCount {
  const m: MaterialCount = { pawns: 0, minors: 0, rooks: 0, queens: 0, nonPawnPoints: 0, totalPoints: 0 };
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isWhitePiece(pc) !== colorWhite) continue;
      const t = pieceType(pc);
      if (t === 'k') continue;
      const v = PIECE_VALUE[t];
      m.totalPoints += v;
      if (t === 'p') m.pawns++;
      else {
        m.nonPawnPoints += v;
        if (t === 'n' || t === 'b') m.minors++;
        else if (t === 'r') m.rooks++;
        else if (t === 'q') m.queens++;
      }
    }
  }
  return m;
}

/** Number of extra pawns on doubled files for `colorWhite`. */
export function doubledPawnFiles(b: Board, colorWhite: boolean): number {
  let count = 0;
  for (let f = 0; f < 8; f++) {
    let n = 0;
    for (let r = 0; r < 8; r++) {
      const pc = b.grid[r][f];
      if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === 'p') n++;
    }
    if (n >= 2) count += n - 1;
  }
  return count;
}

/** Own pawns with no friendly pawn on either adjacent file. */
export function isolatedPawnCount(b: Board, colorWhite: boolean): number {
  let count = 0;
  for (let f = 0; f < 8; f++) {
    const hasAdjacent =
      (f > 0 && fileHasOwnPawn(b, f - 1, colorWhite)) || (f < 7 && fileHasOwnPawn(b, f + 1, colorWhite));
    if (!hasAdjacent && fileHasOwnPawn(b, f, colorWhite)) count += fileOwnPawnCount(b, f, colorWhite);
  }
  return count;
}

function fileHasOwnPawn(b: Board, f: number, colorWhite: boolean): boolean {
  return fileOwnPawnCount(b, f, colorWhite) > 0;
}

function fileOwnPawnCount(b: Board, f: number, colorWhite: boolean): number {
  let n = 0;
  for (let r = 0; r < 8; r++) {
    const pc = b.grid[r][f];
    if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === 'p') n++;
  }
  return n;
}

/** Passed pawns for `colorWhite` (no enemy pawn ahead on same/adjacent files). */
export function passedPawnCount(b: Board, colorWhite: boolean): number {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isWhitePiece(pc) !== colorWhite || pieceType(pc) !== 'p') continue;
      let passed = true;
      for (let df = -1; df <= 1; df++) {
        const ff = f + df;
        if (ff < 0 || ff > 7) continue;
        // rows ahead: for white, rows < r; for black, rows > r.
        for (let rr = colorWhite ? r - 1 : r + 1; rr >= 0 && rr <= 7; rr += colorWhite ? -1 : 1) {
          const e = b.grid[rr][ff];
          if (e && isWhitePiece(e) !== colorWhite && pieceType(e) === 'p') {
            passed = false;
            break;
          }
        }
        if (!passed) break;
      }
      if (passed) count++;
    }
  }
  return count;
}

export function kingSquare(b: Board, colorWhite: boolean): string | null {
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === 'k') return indicesToSq(r, f);
    }
  }
  return null;
}

/** Count distinct enemy pieces attacking the 3×3 zone around the king (+ one rank further ahead). */
export function kingZoneAttackers(b: Board, colorWhite: boolean): number {
  const ks = kingSquare(b, colorWhite);
  if (!ks) return 0;
  const [kr, kf] = sqToIndices(ks);
  const attackers = new Set<string>();
  const zone: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) zone.push([kr + dr, kf + df]);
  }
  // one extra rank ahead of the king (toward the enemy side)
  const ahead = colorWhite ? -1 : 1;
  for (let df = -1; df <= 1; df++) zone.push([kr + 2 * ahead, kf + df]);
  for (const [r, f] of zone) {
    if (!inBoard(r, f)) continue;
    for (const a of attackersOf(b, indicesToSq(r, f), !colorWhite)) attackers.add(a);
  }
  return attackers.size;
}

/** King on its original back rank with pawn cover in front and few escape squares. */
export function kingTrappedOnBackRank(b: Board, colorWhite: boolean): boolean {
  const ks = kingSquare(b, colorWhite);
  if (!ks) return false;
  const [kr, kf] = sqToIndices(ks);
  const backRankRow = colorWhite ? 7 : 0;
  const pawnRow = colorWhite ? 6 : 1;
  if (kr !== backRankRow) return false;
  // pawn shelter directly in front on at least one adjacent file
  let shelter = false;
  for (let df = -1; df <= 1; df++) {
    if (inBoard(pawnRow, kf + df)) {
      const pc = b.grid[pawnRow][kf + df];
      if (pc && isWhitePiece(pc) === colorWhite && pieceType(pc) === 'p') shelter = true;
    }
  }
  if (!shelter) return false;
  // at most one free adjacent square that is not attacked by the enemy
  let escapes = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) {
      const r = kr + dr, f = kf + df;
      if (!inBoard(r, f) || (dr === 0 && df === 0)) continue;
      const occ = b.grid[r][f];
      if (occ && isWhitePiece(occ) === colorWhite) continue;
      if (!isAttacked(b, indicesToSq(r, f), !colorWhite)) escapes++;
    }
  }
  return escapes <= 1;
}

/** Heuristic game phase from material and move number. */
export function detectPhase(fen: string): GamePhase {
  const b = parseFen(fen);
  const mp = materialFor(b, true).nonPawnPoints + materialFor(b, false).nonPawnPoints;
  if (mp <= 14) return 'endgame';
  const parts = fen.split(' ');
  const fullmove = Number(parts[5] ?? '1') || 1;
  const turn = parts[1] === 'w' ? 0 : 1;
  const ply = (fullmove - 1) * 2 + turn;
  if (ply < 16) return 'opening';
  return 'middlegame';
}

/** True when the position contains concrete tactical material (captures winning material, hanging pieces, checks available). */
export function isTacticalContext(fen: string): boolean {
  const b = parseFen(fen);
  const turnWhite = (fen.split(' ')[1] ?? 'w') === 'w';
  if (hangingPieces(b, turnWhite, 1.5).length > 0) return true;
  if (hangingPieces(b, !turnWhite, 3).length > 0) return true;
  if (isAttacked(b, kingSquare(b, turnWhite) ?? 'e1', !turnWhite)) return true; // in check
  return false;
}

/** Format a square piece nicely, e.g. "queen on h5". */
export function describePiece(pc: string): string {
  const names: Record<string, string> = {
    p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
  };
  return names[pieceType(pc)] ?? 'piece';
}
