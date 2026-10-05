// PatternDetector — turns engine-confirmed losses into concrete, recurring
// chess patterns. Every instance is anchored to a real position (FEN) and a
// real evaluation drop; nothing is inferred without engine evidence.

import { Chess } from 'chess.js';
import type { Color, MoveAnalysis, PatternId, PatternInstance } from './types';
import type { DoctorConfig } from './config';
import {
  PIECE_VALUE,
  attackersOf,
  describePiece,
  doubledPawnFiles,
  hangingPieces,
  isolatedPawnCount,
  kingTrappedOnBackRank,
  kingZoneAttackers,
  parseFen,
  pieceAt,
  pieceType,
} from './boardFacts';

const MINOR_ORIGINAL_SQUARES: Record<Color, string[]> = {
  white: ['b1', 'g1', 'c1', 'f1'],
  black: ['b8', 'g8', 'c8', 'f8'],
};

const ROOK_ORIGINAL_SQUARES: Record<Color, string[]> = {
  white: ['a1', 'h1'],
  black: ['a8', 'h8'],
};

const QUEEN_ORIGINAL_SQUARES: Record<Color, string[]> = {
  white: ['d1'],
  black: ['d8'],
};

function moverPov(evalWhite: number, moverWhite: boolean): number {
  return moverWhite ? evalWhite : -evalWhite;
}

function fmtEval(cp: number): string {
  const v = cp / 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
}

function isOwnPiece(pc: string, moverWhite: boolean): boolean {
  const upper = pc === pc.toUpperCase();
  return upper === moverWhite;
}

/** Apply a UCI move to a FEN; returns the new FEN + SAN, or null if illegal. */
function applyUci(fen: string, uci: string): { fen: string; san: string } | null {
  try {
    const c = new Chess(fen);
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
    return m ? { fen: c.fen(), san: m.san } : null;
  } catch {
    return null;
  }
}

/** Enemy pieces attacked by the piece standing on `sq` (turn-independent, board-level). */
function targetsOfPiece(fen: string, sq: string, moverWhite: boolean): { sq: string; name: string; value: number }[] {
  const b = parseFen(fen);
  const targets: { sq: string; name: string; value: number }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pc = b.grid[r][f];
      if (!pc || isOwnPiece(pc, moverWhite)) continue;
      const esq = `${String.fromCharCode(97 + f)}${8 - r}`;
      if (attackersOf(b, esq, moverWhite).includes(sq)) {
        const t = pieceType(pc);
        targets.push({
          sq: esq,
          name: describePiece(pc),
          value: t === 'k' ? 100 : PIECE_VALUE[t],
        });
      }
    }
  }
  return targets;
}

interface Candidate {
  patternId: PatternId;
  detail: string;
}

/**
 * Detect patterns for every classified move of one game.
 * One primary pattern per ply (by priority) plus additive lenses
 * (fast_blunder, endgame_conversion) that can co-exist.
 */
export function detectPatterns(moves: MoveAnalysis[], gameId: string, _config: DoctorConfig): PatternInstance[] {
  const instances: PatternInstance[] = [];

  const PRIORITY: PatternId[] = [
    'allowed_mate',
    'missed_mate',
    'ignored_threat',
    'hanging_piece',
    'back_rank',
    'missed_fork',
    'missed_material_gain',
    'bad_exchange',
    'king_safety',
    'pawn_structure',
    'slow_development',
    'opening_deviation',
    'passive_move',
  ];

  const winning: Record<Color, boolean> = { white: false, black: false };

  for (const m of moves) {
    const candidates: Candidate[] = [];
    const moverWhite = m.color === 'white';
    // Every detector below carries its own cpl gate, so "quiet" moves are never
    // flagged — but every move is still observed so trend trackers stay correct.
    const beforeBoard = parseFen(m.fenBefore);
    const afterBoard = parseFen(m.fenAfter);
    const movedTo = m.uci.slice(2, 4);
    const movedFrom = m.uci.slice(0, 2);
    const beforePov = moverPov(m.evalBeforeWhite, moverWhite);
    const afterPov = moverPov(m.evalAfterWhite, moverWhite);

    // ---------- allowed_mate ----------
    // Only flag when a mate was AVOIDABLE: (a) the engine must not already see
    // forced mate against the mover, and (b) the move must have actually lost
    // evaluation — forced recaptures in lost positions had no alternative.
    const afterIsMateAgainst = Math.abs(m.evalAfterWhite) >= 90000 && afterPov < 0;
    const wasAlreadyMated = beforePov <= -90000;
    if (afterIsMateAgainst && !wasAlreadyMated && m.cpl >= 120) {
      candidates.push({
        patternId: 'allowed_mate',
        detail: `After ${m.san}, the opponent has a forced mate. ${m.bestMoveSan} was necessary.`,
      });
    }

    // ---------- missed tactics: what the engine's best move would have achieved ----------
    if (m.cpl >= 150 && m.bestMoveUci.length >= 4) {
      const bestDest = m.bestMoveUci.slice(2, 4);
      const bestFrom = m.bestMoveUci.slice(0, 2);
      const beforeMateForMover = beforePov >= 90000;

      if (beforeMateForMover && afterPov < 90000) {
        candidates.push({
          patternId: 'missed_mate',
          detail: `You had a forced mate and let it slip — ${m.bestMoveSan} finished the game.`,
        });
      } else {
        const applied = applyUci(m.fenBefore, m.bestMoveUci);
        if (applied) {
          const movedPiece = pieceAt(parseFen(applied.fen), bestDest);
          if (movedPiece && pieceType(movedPiece) !== 'k') {
            const targets = targetsOfPiece(applied.fen, bestDest, moverWhite).filter((t) => t.value >= 3);
            const hasBig = targets.some((t) => t.value >= 5);
            if (targets.length >= 2 && (hasBig || pieceType(movedPiece) === 'n' || pieceType(movedPiece) === 'p')) {
              candidates.push({
                patternId: 'missed_fork',
                detail: `${m.bestMoveSan} hits two targets at once (${targets.map((t) => `${t.name} on ${t.sq}`).join(' and ')}) — a fork you didn't consider.`,
              });
            }
          }

          const destPieceBefore = pieceAt(beforeBoard, bestDest);
          const bestIsWinningCapture =
            destPieceBefore && !isOwnPiece(destPieceBefore, moverWhite)
              ? PIECE_VALUE[pieceType(destPieceBefore)] >= 3
              : false;
          if (bestIsWinningCapture && !beforeMateForMover) {
            candidates.push({
              patternId: 'missed_material_gain',
              detail: `Capturing with ${m.bestMoveSan} wins the ${describePiece(destPieceBefore as string)} on ${bestDest}.`,
            });
          }
        }
      }
    }

    // ---------- ignored_threat: an existing threat was left unanswered ----------
    if (m.cpl >= 120) {
      const threatenedBefore = hangingPieces(beforeBoard, moverWhite, 1.5);
      if (threatenedBefore.length > 0) {
        const stillHangingAfter = new Set(hangingPieces(afterBoard, moverWhite, 1.5).map((h) => h.sq));
        const ignored = threatenedBefore.find((h) => h.sq !== movedFrom && stillHangingAfter.has(h.sq));
        if (ignored) {
          const pc = pieceAt(afterBoard, ignored.sq);
          candidates.push({
            patternId: 'ignored_threat',
            detail: `Your ${describePiece(pc ?? 'P')} on ${ignored.sq} was already under fire — after ${m.san} it is still capturable${ignored.defended ? ' at a profit for the opponent' : ' for free'}. ${m.bestMoveSan} dealt with it.`,
          });
        }
      }
    }

    // ---------- hanging_piece: self-inflicted or newly exposed ----------
    if (m.cpl >= 120) {
      const hangingAfter = hangingPieces(afterBoard, moverWhite, 1.5);
      const hangingBefore = new Set(hangingPieces(beforeBoard, moverWhite, 1.5).map((h) => h.sq));
      const movedPiece = pieceAt(afterBoard, movedTo);
      const movedHangs = movedPiece && isOwnPiece(movedPiece, moverWhite)
        ? hangingAfter.find((h) => h.sq === movedTo)
        : undefined;
      if (movedHangs) {
        candidates.push({
          patternId: 'hanging_piece',
          detail: `${m.san} leaves your ${describePiece(movedPiece as string)} on ${movedTo} capturable ${
            movedHangs.defended ? `profitably (≈${movedHangs.gain.toFixed(1)} pawns)` : 'for free'
          }.`,
        });
      } else {
        const newlyExposed = hangingAfter.find((h) => h.sq !== movedTo && !hangingBefore.has(h.sq));
        if (newlyExposed) {
          const pc = pieceAt(afterBoard, newlyExposed.sq);
          candidates.push({
            patternId: 'hanging_piece',
            detail: `${m.san} takes a defender away from your ${describePiece(pc ?? 'P')} on ${newlyExposed.sq}, which can now be won${newlyExposed.defended ? ' profitably' : ' for free'}.`,
          });
        }
      }
    }

    // ---------- back_rank ----------
    if (m.cpl >= 150 && kingTrappedOnBackRank(afterBoard, moverWhite)) {
      candidates.push({
        patternId: 'back_rank',
        detail: `Your king is walled in on the back rank — ${m.san} ignores the weakness. Enemy heavy pieces can attack along the back rank with little warning.`,
      });
    }

    // ---------- bad_exchange ----------
    if (m.capture && m.cpl >= 150) {
      const ourPiece = pieceAt(afterBoard, movedTo);
      const victim = pieceAt(beforeBoard, movedTo);
      if (ourPiece && isOwnPiece(ourPiece, moverWhite) && victim) {
        const victimVal = PIECE_VALUE[pieceType(victim)];
        const ourVal = PIECE_VALUE[pieceType(ourPiece)];
        const recaptureGain = hangingPieces(afterBoard, moverWhite, 0).find((h) => h.sq === movedTo);
        if (victimVal - ourVal <= -1.5 || (recaptureGain && victimVal - ourVal + recaptureGain.gain < 0.5)) {
          candidates.push({
            patternId: 'bad_exchange',
            detail: `The capture ${m.san} loses material — after the recapture you come out ≈${(ourVal - victimVal).toFixed(1)} pawns down.`,
          });
        }
      }
    }

    // ---------- king_safety ----------
    if (m.cpl >= 120 && m.moveNumber >= 8) {
      const kzaBefore = kingZoneAttackers(beforeBoard, moverWhite);
      const kzaAfter = kingZoneAttackers(afterBoard, moverWhite);
      if (kzaAfter - kzaBefore >= 2) {
        candidates.push({
          patternId: 'king_safety',
          detail: `${m.san} lets enemy pieces swarm your king (attackers in the king zone: ${kzaBefore} → ${kzaAfter}).`,
        });
      }
    }

    // ---------- pawn_structure ----------
    if (m.cpl >= 100) {
      const structBefore = doubledPawnFiles(beforeBoard, moverWhite) + isolatedPawnCount(beforeBoard, moverWhite);
      const structAfter = doubledPawnFiles(afterBoard, moverWhite) + isolatedPawnCount(afterBoard, moverWhite);
      if (structAfter > structBefore) {
        candidates.push({
          patternId: 'pawn_structure',
          detail: `${m.san} damages your pawn structure (doubled/isolated pawns: ${structBefore} → ${structAfter}) without compensation.`,
        });
      }
    }

    // ---------- slow_development ----------
    if (m.phase === 'opening' && m.cpl >= 80) {
      const movedPieceChar = pieceAt(beforeBoard, movedFrom);
      const pt = movedPieceChar ? pieceType(movedPieceChar) : null;
      const minorsHome = MINOR_ORIGINAL_SQUARES[m.color].filter((s) => {
        const pc = pieceAt(beforeBoard, s);
        return pc && isOwnPiece(pc, moverWhite) && (pieceType(pc) === 'n' || pieceType(pc) === 'b');
      }).length;
      if (pt === 'q' && m.moveNumber <= 5) {
        candidates.push({
          patternId: 'slow_development',
          detail: `The queen comes out on move ${m.moveNumber} while ${minorsHome} minor pieces are still at home — an early target for tempo-gaining attacks.`,
        });
      } else if (
        pt && pt !== 'k' && pt !== 'p' && minorsHome >= 2 &&
        !MINOR_ORIGINAL_SQUARES[m.color].includes(movedFrom) &&
        !ROOK_ORIGINAL_SQUARES[m.color].includes(movedFrom) &&
        !QUEEN_ORIGINAL_SQUARES[m.color].includes(movedFrom)
      ) {
        candidates.push({
          patternId: 'slow_development',
          detail: `You moved an already-developed piece (${movedFrom}${movedTo}) again while ${minorsHome} minor pieces were still undeveloped.`,
        });
      }
    }

    // ---------- opening_deviation ----------
    if (m.phase === 'opening' && m.cpl >= 100) {
      candidates.push({
        patternId: 'opening_deviation',
        detail: `Early deviation: ${m.san} already costs ${m.cpl}cp of evaluation. Worth studying this line up to move ${m.moveNumber}.`,
      });
    }

    // ---------- passive_move ----------
    if (m.cpl >= 150 && m.phase !== 'endgame' && !m.capture && !m.check && m.classification !== 'inaccuracy') {
      const destRank = Number(movedTo[1]);
      const ownHalf = moverWhite ? destRank <= 4 : destRank >= 5;
      if (ownHalf && afterPov <= -50) {
        candidates.push({
          patternId: 'passive_move',
          detail: `${m.san} retreats to your own half while the position calls for activity (eval after: ${fmtEval(afterPov)}).`,
        });
      }
    }

    // ---------- endgame_conversion (additive lens) ----------
    if (!winning[m.color] && beforePov >= 250) winning[m.color] = true;
    if (winning[m.color] && m.phase === 'endgame' && afterPov <= 80) {
      candidates.push({
        patternId: 'endgame_conversion',
        detail: `You were winning (${fmtEval(beforePov)}) in the endgame, but by move ${m.moveNumber} the advantage melted to ${fmtEval(afterPov)}.`,
      });
      winning[m.color] = false;
    }
    if (afterPov < -50) winning[m.color] = false;

    // ---------- fast_blunder (additive lens, needs clock data) ----------
    if (m.secondsSpent !== undefined && m.secondsSpent <= 8 && m.cpl >= 200) {
      candidates.push({
        patternId: 'fast_blunder',
        detail: `${m.san} was played in ${m.secondsSpent}s — a move this costly deserves a candidate-move check (opponent's checks, captures, threats).`,
      });
    }

    // one primary pattern per ply, by priority — keeps counts honest
    const primary = PRIORITY.find((p) => candidates.some((c) => c.patternId === p));
    const additive = candidates.filter((c) => c.patternId === 'fast_blunder' || c.patternId === 'endgame_conversion');
    const chosen: Candidate[] = [];
    if (primary) chosen.push(candidates.find((c) => c.patternId === primary) as Candidate);
    chosen.push(...additive);

    for (const c of chosen) {
      instances.push({
        patternId: c.patternId,
        gameId,
        ply: m.ply,
        moveNumber: m.moveNumber,
        color: m.color,
        phase: m.phase,
        san: m.san,
        fenBefore: m.fenBefore,
        fenAfter: m.fenAfter,
        evalLoss: m.cpl,
        bestMoveSan: m.bestMoveSan,
        bestMoveUci: m.bestMoveUci,
        detail: c.detail,
        secondsSpent: m.secondsSpent,
      });
    }
  }

  return instances;
}
