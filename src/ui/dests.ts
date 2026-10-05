// Legal-move destination map for interactive boards (chessground dests format).

import { Chess } from 'chess.js';

export function destsForFen(fen: string): Map<string, string[]> {
  const dests = new Map<string, string[]>();
  try {
    const c = new Chess(fen);
    for (const m of c.moves({ verbose: true })) {
      const list = dests.get(m.from) ?? [];
      if (!list.includes(m.to)) list.push(m.to);
      dests.set(m.from, list);
    }
  } catch {
    /* invalid fen → no dests (view-only) */
  }
  return dests;
}
