// Game Explorer — browse analyzed games move by move with classification
// badges, evaluations, clocks, and critical-moment jumps.

import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { useStore } from '../App';
import Board from './Board';
import { ClassificationBadge, EmptyState, fmtClock, fmtEval } from './bits';
import type { GameAnalysis } from '../core/types';
import { PATTERN_META } from '../core/explain';

export function GamesView() {
  const store = useStore();
  const games = store.filteredGames;

  // Selected game: list clicks win, then deep-links (explorer), then the newest.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = store.explorer?.gameId ?? selectedId ?? games[0]?.id;
  const game = games.find((g) => g.id === activeId) ?? games[0];
  const totalPlies = game?.moves.length ?? 0;

  const [ply, setPly] = useState(0);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const lastGameId = useRef<string | null>(null);

  // Follow the explorer target (diagnosis clicks); on a fresh game selection,
  // land on the final position.
  useEffect(() => {
    if (!game) return;
    if (store.explorer && store.explorer.gameId === game.id) {
      const target = Math.max(0, Math.min(totalPlies, store.explorer.ply));
      setPly(target);
      const m = game.moves[target - 1];
      setOrientation(target > 0 && m ? m.color : 'white');
    } else if (lastGameId.current !== game.id) {
      setPly(totalPlies);
      setOrientation('white');
    }
    lastGameId.current = game.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.explorer?.gameId, store.explorer?.ply, game?.id, totalPlies]);

  // Keyboard navigation (guarded so hooks stay unconditional).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, p - 1));
      else if (e.key === 'ArrowRight') setPly((p) => Math.min(totalPlies, p + 1));
      else if (e.key === 'Home') setPly(0);
      else if (e.key === 'End') setPly(totalPlies);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalPlies]);

  if (!game) {
    return <EmptyState icon="🔎" title="No games" text="Import and analyze games first." />;
  }

  const jump = (p: number) => setPly(Math.max(0, Math.min(totalPlies, p)));

  const current = ply > 0 ? game.moves[ply - 1] : null;
  const fen = current ? current.fenAfter : game.startFen;
  const lastMove = current ? ([current.uci.slice(0, 2), current.uci.slice(2, 4)] as [string, string]) : null;
  let inCheck = false;
  try {
    inCheck = new Chess(fen).isCheck();
  } catch {
    inCheck = false;
  }
  const evalNow = current ? current.evalAfterWhite : (game.moves[0]?.evalBeforeWhite ?? 0);
  const playerColor = game.info.playerColor;

  return (
    <div className="games-layout">
      <aside className="games-list panel">
        <div className="panel-head"><h2>Games</h2></div>
        <div className="panel-body game-list-body">
          {games.map((g) => (
            <button
              key={g.id}
              className={`game-row ${g.id === game.id ? 'active' : ''}`}
              onClick={() => {
                store.setExplorer(null);
                setSelectedId(g.id);
                setPly(g.moves.length);
                setOrientation('white');
              }}
            >
              <div className="game-row-top">
                <strong>{g.info.white} – {g.info.black}</strong>
                <span className={`result-chip ${g.info.resultForPlayer ?? ''}`}>
                  {g.info.resultForPlayer === 'win' ? 'W' : g.info.resultForPlayer === 'loss' ? 'L' : g.info.resultForPlayer === 'draw' ? 'D' : '·'}
                </span>
              </div>
              <div className="game-row-sub muted">
                {g.info.date ?? 'unknown date'} · {g.info.timeControlKind} · {g.moves.length} plies
                {g.info.eco ? ` · ${g.info.eco}` : ''}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="games-main">
        <div className="board-col">
          <div className="board-with-bar">
            <EvalBar cp={evalNow} />
            <Board
              fen={fen}
              orientation={orientation}
              lastMove={lastMove}
              check={inCheck}
              className="large"
            />
          </div>
          <div className="board-controls">
            <button className="btn ghost" onClick={() => jump(0)} title="Start">⏮</button>
            <button className="btn ghost" onClick={() => jump(ply - 1)} title="Previous (←)">◀</button>
            <span className="muted move-indicator">
              {ply === 0 ? 'start position' : `move ${current?.moveNumber}${current?.color === 'white' ? '.' : '…'} ${current?.san}`}
            </span>
            <button className="btn ghost" onClick={() => jump(ply + 1)} title="Next (→)">▶</button>
            <button className="btn ghost" onClick={() => jump(totalPlies)} title="End">⏭</button>
            <button className="btn ghost" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} title="Flip board">⇅</button>
          </div>
        </div>

        <div className="moves-col panel">
          <div className="panel-head">
            <div>
              <h2>{game.info.white} – {game.info.black}</h2>
              <p className="panel-sub">
                {game.info.result} · {game.info.timeControlKind}
                {game.info.whiteElo ? ` · ${game.info.whiteElo}` : ''}
                {game.info.blackElo ? `–${game.info.blackElo}` : ''}
                {game.info.eco ? ` · ${game.info.eco} ${game.info.opening ?? ''}` : ''}
                {playerColor ? ` · you played ${playerColor}` : ''}
              </p>
            </div>
          </div>
          <div className="panel-body">
            <div className="critical-row">
              <span className="muted">Critical moments:</span>
              {game.criticalPlies.slice(0, 16).map((p) => {
                const m = game.moves[p - 1];
                if (!m) return null;
                return (
                  <button key={p} className={`chip ${ply === p ? 'active' : ''}`} onClick={() => jump(p)}>
                    {m.moveNumber}{m.color === 'white' ? '.' : '…'}<ClassificationBadge c={m.classification} />
                  </button>
                );
              })}
              {game.criticalPlies.length === 0 && <span className="muted">none flagged</span>}
            </div>

            <div className="moves-table" role="list">
              {moveRows(game).map((row) => (
                <div key={row.moveNumber} className="move-row">
                  <span className="move-num">{row.moveNumber}.</span>
                  {row.white
                    ? <MoveCell m={row.white} active={ply === row.white.ply} onClick={() => jump(row.white!.ply)} />
                    : <span className="move-cell empty" />}
                  {row.black
                    ? <MoveCell m={row.black} active={ply === row.black.ply} onClick={() => jump(row.black!.ply)} />
                    : <span className="move-cell empty" />}
                </div>
              ))}
            </div>

            {current && (
              <div className="move-detail">
                <h4>Position detail — move {current.moveNumber} ({current.color})</h4>
                <div className="detail-grid">
                  <div>
                    <div className="muted">Evaluation</div>
                    <div>{fmtEval(current.evalBeforeWhite)} → <strong>{fmtEval(current.evalAfterWhite)}</strong></div>
                  </div>
                  <div>
                    <div className="muted">Centipawn loss</div>
                    <div>{current.cpl}cp</div>
                  </div>
                  <div>
                    <div className="muted">Engine best</div>
                    <div>{current.bestMoveSan || '—'}</div>
                  </div>
                  <div>
                    <div className="muted">Phase</div>
                    <div>{current.phase}{current.tacticalContext ? ' · tactical' : ''}</div>
                  </div>
                  {current.secondsSpent !== undefined && (
                    <div>
                      <div className="muted">Time spent</div>
                      <div>{fmtClock(current.secondsSpent)}</div>
                    </div>
                  )}
                </div>
                {current.pvSan.length > 0 && <p className="muted">Engine line: {current.pvSan.join(' ')}</p>}
                {current.patterns.length > 0 && (
                  <div className="pattern-chips">
                    {current.patterns.map((p) => (
                      <span key={p} className="badge cat-tactical">
                        {PATTERN_META[p as keyof typeof PATTERN_META]?.title ?? p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveCell({ m, active, onClick }: { m: GameAnalysis['moves'][number]; active: boolean; onClick: () => void }) {
  return (
    <button className={`move-cell ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="san">{m.san}</span>
      <ClassificationBadge c={m.classification} />
      <span className="move-eval muted">{fmtEval(m.evalAfterWhite)}</span>
      {m.secondsSpent !== undefined && <span className="move-clock muted">{fmtClock(m.secondsSpent)}</span>}
    </button>
  );
}

function EvalBar({ cp }: { cp: number }) {
  const clamped = Math.max(-800, Math.min(800, cp));
  const whitePct = 50 + (clamped / 800) * 45;
  return (
    <div className="eval-bar" title={`Evaluation: ${fmtEval(cp)}`}>
      <div className="eval-white" style={{ height: `${whitePct}%` }} />
    </div>
  );
}

interface Row {
  moveNumber: number;
  white?: GameAnalysis['moves'][number];
  black?: GameAnalysis['moves'][number];
}

function moveRows(game: GameAnalysis): Row[] {
  const rows: Row[] = [];
  for (const m of game.moves) {
    let row = rows.find((r) => r.moveNumber === m.moveNumber);
    if (!row) {
      row = { moveNumber: m.moveNumber };
      rows.push(row);
    }
    if (m.color === 'white') row.white = m;
    else row.black = m;
  }
  return rows;
}
