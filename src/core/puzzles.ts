// PuzzleGenerator — every meaningful mistake becomes a personalised puzzle:
// the position before the mistake, the engine's best move as the solution,
// and the explanation of "what you played" vs "what the position required".

import { Chess } from 'chess.js';
import type { DoctorConfig } from './config';
import type { GameAnalysis, Puzzle } from './types';
import { PATTERN_META } from './explain';

export function buildPuzzles(games: GameAnalysis[], config: DoctorConfig, playerName = ''): Puzzle[] {
  const puzzles: Puzzle[] = [];
  for (const g of games) {
    for (const inst of g.instances) {
      // player's own mistakes only (when the player is known)
      if (playerName && g.info.playerColor && inst.color !== g.info.playerColor) continue;
      if (inst.evalLoss < config.puzzleMinLoss) continue;
      if (!inst.bestMoveUci || inst.bestMoveUci.length < 4) continue;
      // skip positions where the side to move is already mated (no move to find)
      let legal = false;
      try {
        legal = new Chess(inst.fenBefore).moves().length > 0;
      } catch {
        continue;
      }
      if (!legal) continue;

      const swing = inst.evalLoss;
      const difficulty: Puzzle['difficulty'] = swing >= 500 ? 'advanced' : swing >= 300 ? 'intermediate' : 'easy';
      const meta = PATTERN_META[inst.patternId];

      puzzles.push({
        id: `${g.id}-${inst.ply}`,
        gameId: g.id,
        gameLabel: `${g.info.white} – ${g.info.black}`,
        ply: inst.ply,
        fen: inst.fenBefore,
        solutionUci: inst.bestMoveUci,
        solutionSan: inst.bestMoveSan,
        playedSan: inst.san,
        evalLoss: inst.evalLoss,
        theme: meta.title,
        category: meta.category,
        difficulty,
        detail: inst.detail,
        bestPvSan: [],
      });
    }
  }
  // hardest first
  puzzles.sort((a, b) => b.evalLoss - a.evalLoss);
  return puzzles;
}

export function puzzleMoveIsCorrect(fen: string, from: string, to: string, promotion: string | undefined, solutionUci: string): boolean {
  const solFrom = solutionUci.slice(0, 2);
  const solTo = solutionUci.slice(2, 4);
  if (from !== solFrom || to !== solTo) return false;
  // The puzzle UI has no piece selector, so any legal promotion of the correct
  // from→to counts as found (the idea, not the exact promotion piece, is the test).
  try {
    const c = new Chess(fen);
    return Boolean(c.move({ from, to, promotion: promotion ?? 'q' }));
  } catch {
    return false;
  }
}
