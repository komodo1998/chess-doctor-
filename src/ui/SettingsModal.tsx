// Settings — player identity, engine depth, thresholds, data management.

import { useRef } from 'react';
import { useStore } from '../App';
import { Modal } from './bits';
import { CLASSIFICATION_RULES_TEXT } from '../core/config';
import { exportState } from '../core/storage';

export function SettingsModal() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cfg = store.config;

  const updateConfig = (patch: Partial<typeof cfg>) => {
    store.updateSettings({ config: { ...cfg, ...patch } });
  };

  const onExport = () => {
    const blob = new Blob([exportState(store.state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-doctor-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const ok = store.doImportState(text);
    if (!ok) alert('Could not import: not a valid Chess Doctor export.');
    else store.setSettingsOpen(false);
  };

  return (
    <Modal title="Settings" onClose={() => store.setSettingsOpen(false)}>
      <div className="settings-form">
        <label>
          <span>Player name (from your PGN headers)</span>
          <input
            type="text"
            value={store.playerName}
            placeholder="e.g. Magnus C."
            onChange={(e) => store.updateSettings({ playerName: e.target.value })}
          />
          <small>Used to decide which side you played in each game. Leave empty to analyze both sides combined.</small>
        </label>

        <label>
          <span>Engine depth (analysis strength)</span>
          <select
            value={cfg.depth}
            onChange={(e) => updateConfig({ depth: Number(e.target.value) })}
          >
            {[10, 12, 14, 16, 18, 20].map((d) => (
              <option key={d} value={d}>{d} {d <= 12 ? '(fast)' : d <= 16 ? '(balanced)' : '(deep, slower)'}</option>
            ))}
          </select>
          <small>Applies to newly imported games. Higher depth = more accurate evaluations, slower analysis. Stockfish 19 runs on all CPU cores when served by the dev/preview servers.</small>
        </label>

        <fieldset>
          <legend>Classification thresholds (centipawn loss)</legend>
          <div className="threshold-grid">
            {(
              [
                ['excellent', 'Excellent ≤'],
                ['good', 'Good ≤'],
                ['inaccuracy', 'Inaccuracy ≤'],
                ['mistake', 'Mistake ≤'],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="number"
                  value={cfg.classification[key]}
                  min={10}
                  max={900}
                  onChange={(e) =>
                    updateConfig({ classification: { ...cfg.classification, [key]: Number(e.target.value) || cfg.classification[key] } })
                  }
                />
              </label>
            ))}
          </div>
          <small>{CLASSIFICATION_RULES_TEXT.join(' · ')}</small>
        </fieldset>

        <fieldset>
          <legend>Data</legend>
          <div className="btn-row">
            <button className="btn" onClick={onExport}>Export all data (JSON)</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import data</button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => onImportFile(e.target.files?.[0])} />
            <button
              className="btn danger"
              onClick={() => {
                if (confirm('Delete all analyzed games, puzzle progress and settings? This cannot be undone.')) {
                  store.resetAll();
                  store.setSettingsOpen(false);
                }
              }}
            >
              Delete everything
            </button>
          </div>
          <small>{store.state.games.length} analyzed game(s) stored locally in this browser.</small>
        </fieldset>

        <div className="about">
          <strong>About the diagnosis</strong>
          <p>
            Chess Doctor never diagnoses from a single mistake: a pattern needs ≥ {cfg.diagnosis.minInstances} occurrences
            across ≥ {cfg.diagnosis.minGames} games before it appears as a diagnosis, and each card shows exactly which
            positions produced it. The engine (Stockfish) is the source of chess truth; the coaching text only explains it.
          </p>
        </div>
      </div>
    </Modal>
  );
}
