// Puzzle trainer — the player's own mistakes, replayed as puzzles.
// Find the engine's best move; then see what you played vs what was required.

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { useStore } from '../App';
import Board from './Board';
import { EmptyState, Section } from './bits';
import { destsForFen } from './dests';
import { buildPuzzles, puzzleMoveIsCorrect } from '../core/puzzles';
import type { Puzzle } from '../core/types';

type Feedback = 'none' | 'wrong' | 'solved' | 'revealed';

export function PuzzlesView() {
  const store = useStore();

  const puzzles = useMemo(
    () => buildPuzzles(store.filteredGames, store.config, store.playerName),
    [store.filteredGames, store.config, store.playerName]
  );

  const firstUnsolved = useMemo(() => {
    const idx = puzzles.findIndex((p) => !store.state.puzzleResults[p.id]?.solved);
    return idx >= 0 ? idx : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzles.length]);

  const [index, setIndex] = useState(firstUnsolved);
  const [feedback, setFeedback] = useState<Feedback>('none');
  const [lastTry, setLastTry] = useState<{ from: string; to: string } | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const solvedCount = puzzles.filter((p) => store.state.puzzleResults[p.id]?.solved).length;

  if (puzzles.length === 0) {
    return (
      <EmptyState
        icon="♟"
        title="No puzzles available"
        text={`Puzzles are generated from your mistakes with an eval loss of at least ${(store.config.puzzleMinLoss / 100).toFixed(1)} pawns. Analyze more games — every blunder becomes practice.`}
      />
    );
  }

  const puzzle: Puzzle = puzzles[Math.min(index, puzzles.length - 1)];
  const turnWhite = (puzzle.fen.split(' ')[1] ?? 'w') === 'w';
  const orientation = turnWhite ? 'white' : 'black';
  const done = feedback === 'solved' || feedback === 'revealed';

  const attempt = (from: string, to: string) => {
    if (done) return;
    let promo: string | undefined;
    try {
      const c = new Chess(puzzle.fen);
      const piece = c.get(from as never) as { type?: string } | undefined;
      if (piece?.type === 'p' && (to[1] === '8' || to[1] === '1')) promo = 'q';
    } catch {
      promo = undefined;
    }
    const ok = puzzleMoveIsCorrect(puzzle.fen, from, to, promo, puzzle.solutionUci);
    store.markPuzzle(puzzle.id, ok);
    if (ok) {
      setFeedback('solved');
      setLastTry(null);
    } else {
      setFeedback('wrong');
      setLastTry({ from, to });
      setTimeout(() => setResetKey((k) => k + 1), 400); // snap the piece back
    }
  };

  const reveal = () => {
    store.markPuzzle(puzzle.id, false);
    setFeedback('revealed');
  };

  const go = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min(puzzles.length - 1, i + delta)));
    setFeedback('none');
    setLastTry(null);
    setResetKey((k) => k + 1);
  };

  const shapes = done
    ? [{ orig: puzzle.solutionUci.slice(0, 2), dest: puzzle.solutionUci.slice(2, 4), brush: feedback === 'solved' ? 'green' : 'blue' }]
    : lastTry
      ? [{ orig: lastTry.from, dest: lastTry.to, brush: 'red' }]
      : [];

  return (
    <Section
      title={`Puzzle ${Math.min(index, puzzles.length - 1) + 1} of ${puzzles.length}`}
      subtitle={`${solvedCount} solved · From your game ${puzzle.gameLabel}, move ${puzzle.ply}. Find the best move for ${orientation}.`}
      right={
        <div className="btn-row">
          <button className="btn ghost" onClick={() => go(-1)} disabled={index <= 0}>◀</button>
          <button className="btn ghost" onClick={() => go(1)} disabled={index >= puzzles.length - 1}>▶</button>
        </div>
      }
    >
      <div className="puzzle-grid">
        <div>
          <Board
            key={resetKey}
            fen={puzzle.fen}
            orientation={orientation}
            dests={done ? null : destsForFen(puzzle.fen)}
            onMove={attempt}
            shapes={shapes}
            className="large"
          />
          <div className="puzzle-actions">
            {feedback === 'none' && <span className="muted">{turnWhite ? 'White' : 'Black'} to move — this was your position.</span>}
            {feedback === 'wrong' && <span className="feedback bad">Not that. Look again: checks, captures, threats — for both sides.</span>}
            {feedback === 'solved' && <span className="feedback good">✔ Correct — {puzzle.solutionSan}!</span>}
            {feedback === 'revealed' && <span className="feedback info">Solution: {puzzle.solutionSan}</span>}
            <button className="btn ghost small" onClick={reveal} disabled={done}>Show solution</button>
          </div>
        </div>

        <div className="puzzle-info">
          <div className="badge-row">
            <span className={`badge diff-${puzzle.difficulty}`}>{puzzle.difficulty}</span>
            <span className="badge cat-tactical">{puzzle.theme}</span>
            <span className="loss-chip">you lost {(puzzle.evalLoss / 100).toFixed(2)} pawns</span>
          </div>

          <h4>Why did you play {puzzle.playedSan}?</h4>
          <p className="diag-detail">{puzzle.detail}</p>

          {done && (
            <>
              <h4>What you played vs what the position required</h4>
              <table className="table compare">
                <tbody>
                  <tr>
                    <td className="muted">You played</td>
                    <td className="san played">{puzzle.playedSan}</td>
                    <td className="muted">loses {(puzzle.evalLoss / 100).toFixed(2)} pawns</td>
                  </tr>
                  <tr>
                    <td className="muted">Position required</td>
                    <td className="san best">{puzzle.solutionSan}</td>
                    <td className="muted">engine's choice</td>
                  </tr>
                </tbody>
              </table>
              <button className="btn small" onClick={() => store.openPosition(puzzle.gameId, puzzle.ply)}>
                See it in the full game
              </button>
            </>
          )}

          <p className="muted small-print">
            Theme: {puzzle.theme} · Difficulty: {puzzle.difficulty}. The solution is the engine's best move at
            depth {store.config.depth} — the same evidence that produced your diagnosis.
          </p>
        </div>
      </div>
    </Section>
  );
}
