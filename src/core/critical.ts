// CriticalPositionDetector — decide which moments deserve the spotlight.
// Prioritises instructional value: eval swings, missed wins, phase transitions,
// major material events and anything the pattern detector flagged.

import type { MoveAnalysis, PatternInstance } from './types';
import type { DoctorConfig } from './config';
import { PIECE_VALUE, parseFen, pieceAt, pieceType } from './boardFacts';

export function detectCriticalPlies(
  moves: MoveAnalysis[],
  instances: PatternInstance[],
  config: DoctorConfig
): number[] {
  const flagged = new Set<number>();
  const patternPlies = new Set(instances.map((i) => i.ply));

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const swing = Math.abs(m.evalAfterWhite - m.evalBeforeWhite);
    const prev = i > 0 ? moves[i - 1] : null;

    let critical = false;
    if (m.cpl >= config.critical.cpl) critical = true;
    if (swing >= config.critical.swing) critical = true;
    if (patternPlies.has(m.ply)) critical = true;
    if (prev && prev.phase !== m.phase) critical = true; // phase transition moment
    if (m.capture && victimValue(m) >= 5) critical = true; // rook/queen exchange
    if (m.phase === 'opening' && m.cpl >= 100) critical = true; // opening deviation
    if (critical) flagged.add(m.ply);
  }

  return [...flagged].sort((a, b) => a - b);
}

/** Exact victim value: the piece that stood on the destination square before the move. */
function victimValue(m: MoveAnalysis): number {
  if (!m.capture) return 0;
  const to = m.uci.slice(2, 4);
  const pc = pieceAt(parseFen(m.fenBefore), to);
  return pc ? PIECE_VALUE[pieceType(pc)] : 0;
}
