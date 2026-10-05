// Modal listing the games found in a multi-game PGN file so the user can
// pick which ones to import — tick games one by one, or select/deselect all.

import { useEffect, useRef, useState } from 'react';
import type { ParsedGame } from '../core/pgn';
import { Modal } from './bits';

interface Props {
  games: ParsedGame[];
  /** Parse errors for games in the same file that could not be read. */
  errors: string[];
  fileName: string;
  onCancel: () => void;
  onConfirm: (selected: ParsedGame[]) => void;
}

function metaParts(g: ParsedGame): string[] {
  const parts: string[] = [];
  if (g.info.date) parts.push(g.info.date);
  if (g.info.event) parts.push(g.info.event);
  if (g.info.eco) parts.push(g.info.opening ? `${g.info.eco} ${g.info.opening}` : g.info.eco);
  else if (g.info.opening) parts.push(g.info.opening);
  if (g.info.timeControlKind !== 'unknown') parts.push(g.info.timeControlKind);
  else if (g.info.timeControl) parts.push(g.info.timeControl);
  parts.push(`${g.plies.length} moves`);
  return parts;
}

export function GamePickerModal({ games, errors, fileName, onCancel, onConfirm }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(games.map((_, i) => i)));
  const allRef = useRef<HTMLInputElement | null>(null);

  const allSelected = selected.size === games.length;
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = selected.size > 0 && !allSelected;
  }, [selected.size, allSelected]);

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(games.map((_, i) => i)));
  };
  const toggleOne = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const confirm = () => onConfirm(games.filter((_, i) => selected.has(i)));

  return (
    <Modal title="Choose games to import" onClose={onCancel} wide>
      <p className="muted small-print" style={{ marginTop: 4 }}>
        <strong>{fileName}</strong> contains {games.length} games. Tick the ones to analyze — everything is pre-selected.
      </p>

      <div className="game-picker-head-row">
        <label>
          <input ref={allRef} type="checkbox" checked={allSelected} onChange={toggleAll} />
          <strong>{allSelected ? 'Deselect all' : 'Select all'}</strong>
        </label>
        <span className="muted">{selected.size} of {games.length} selected</span>
      </div>

      <div className="game-picker-list">
        {games.map((g, i) => (
          <label key={i} className={`game-picker-row ${selected.has(i) ? 'checked' : ''}`}>
            <input type="checkbox" checked={selected.has(i)} onChange={() => toggleOne(i)} />
            <span className="game-picker-main">
              <span className="game-picker-names">{g.info.white} – {g.info.black}</span>
              <span className="game-picker-meta">
                <span className="picker-result">{g.info.result}</span>
                {metaParts(g).map((m, j) => <span key={j}>{m}</span>)}
              </span>
            </span>
          </label>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="notice error">
          <strong>{errors.length} game{errors.length > 1 ? 's' : ''} in this file could not be parsed and will be skipped:</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <div className="game-picker-foot">
        <span className="muted small-print">Only the selected games run through Stockfish.</span>
        <span className="btn-row">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={confirm} disabled={selected.size === 0}>
            Analyze {selected.size} game{selected.size === 1 ? '' : 's'}
          </button>
        </span>
      </div>
    </Modal>
  );
}
