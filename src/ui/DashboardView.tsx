// Chess Doctor dashboard: import panel, key measurements, condition summary,
// trend charts, and the top recurring problems.

import { useMemo, useRef, useState } from 'react';
import { useStore } from '../App';
import { parsePgn } from '../core/pgn';
import type { ParsedGame } from '../core/pgn';
import { LineChart, Sparkline } from './charts';
import { ClassificationBadge, EmptyState, ProgressBar, Section, Stat } from './bits';
import { GamePickerModal } from './GamePickerModal';
import Board from './Board';
import { CLASSIFICATION_RULES_TEXT } from '../core/config';
import type { ChessDiagnosis } from '../core/types';
import { PATTERN_META } from '../core/explain';

const SAMPLE_PGN_URL = '/samples/demo-games.pgn';

export function DashboardView() {
  const store = useStore();
  const { dashboard: d, analysis, state } = store;
  const [pgnText, setPgnText] = useState('');
  // Import area shows parsed game details instead of the raw PGN. previewReady
  // gates the swap to bulk input (paste/drop/file/samples) so a PGN can still
  // be typed by hand; showRaw forces the plain textarea back on demand.
  const [showRaw, setShowRaw] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [picker, setPicker] = useState<{ games: ParsedGame[]; errors: string[]; fileName: string } | null>(null);
  const [fileErrors, setFileErrors] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const parsedPreview = useMemo(() => {
    const text = pgnText.trim();
    if (!text) return null;
    return parsePgn(text);
  }, [pgnText]);
  const previewGames = parsedPreview?.games ?? [];
  const showPreview = !showRaw && previewReady && previewGames.length > 0;
  const activeIdx = Math.min(selectedIdx, previewGames.length - 1);
  const selectedGame = showPreview ? previewGames[activeIdx] : undefined;

  const onImport = async () => {
    const text = pgnText.trim();
    if (!text) return;
    setFileErrors(null);
    await store.importAndAnalyze(text);
    setPgnText('');
    setShowRaw(false);
    setPreviewReady(false);
    setSelectedIdx(0);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = (await f.text()).slice(0, 2_000_000);
    const { games, errors } = parsePgn(text);
    if (games.length > 1) {
      // Multi-game file: open the picker so the user chooses what to import.
      setFileErrors(null);
      setPicker({ games, errors, fileName: f.name });
      return;
    }
    setPgnText(text);
    setShowRaw(false);
    setPreviewReady(true);
    setSelectedIdx(0);
    setFileErrors(games.length === 0 ? (errors.length ? errors : ['No valid games found in this file.']) : null);
  };

  const onPickerConfirm = async (selected: ParsedGame[]) => {
    const errs = picker?.errors ?? [];
    setPicker(null);
    if (selected.length === 0) return;
    await store.analyzeGames(selected, errs);
  };

  const onLoadSamples = async () => {
    try {
      const res = await fetch(SAMPLE_PGN_URL);
      const text = await res.text();
      setPgnText(text);
      setShowRaw(false);
      setPreviewReady(true);
      setSelectedIdx(0);
    } catch {
      /* sample file missing — leave the textarea as-is */
    }
  };

  const openDiagnosis = (diag: ChessDiagnosis) => {
    store.setTab('diagnoses');
    setTimeout(() => {
      document.getElementById(`diag-${diag.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const topEvidence = d.diagnoses[0]?.evidence[0];

  return (
    <>
      {!analysis.running && (
        <Section
          title="Import games"
          subtitle="Paste PGN text or drop a .pgn file. Each game is analyzed by Stockfish 19 NNUE (universal WASM build, all cores) at the depth set in Settings."
        >
          <div className="import-grid">
            <div>
              {showPreview ? (
                <div className="pgn-preview">
                  {previewGames.length > 1 && (
                    <div className="pgn-games-list">
                      {previewGames.map((g, i) => (
                        <button
                          key={i}
                          className={`pgn-game-row ${i === activeIdx ? 'active' : ''}`}
                          onClick={() => setSelectedIdx(i)}
                        >
                          <div className="pgn-game-row-top">
                            <strong>{g.info.white} – {g.info.black}</strong>
                            <span className={`result-chip ${chipFor(g, store.playerName)}`}>
                              {CHIP_LETTER[chipFor(g, store.playerName)] ?? '·'}
                            </span>
                          </div>
                          <div className="pgn-game-row-sub muted">
                            {g.info.date ?? 'unknown date'} · {g.info.timeControlKind} · {Math.ceil(g.plies.length / 2)} moves
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedGame && <GameDetails game={selectedGame} youName={store.playerName} />}
                  {parsedPreview && parsedPreview.errors.length > 0 && (
                    <div className="notice error">
                      <strong>Some sections of this PGN could not be parsed:</strong>
                      <ul>{parsedPreview.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  className="pgn-input"
                  placeholder={'[Event "Rated blitz game"]\n[White "you"]\n[Black "opponent"]\n[Result "0-1"]\n\n1. e4 e5 2. Nf3 ...'}
                  value={pgnText}
                  onChange={(e) => {
                    setPgnText(e.target.value);
                    // Bulk input (paste/drop) flips to the game-details view;
                    // character-by-character typing keeps the textarea.
                    const inputType = (e.nativeEvent as InputEvent).inputType;
                    setPreviewReady(inputType === 'insertFromPaste' || inputType === 'insertFromDrop');
                  }}
                  rows={10}
                  spellCheck={false}
                />
              )}
              <div className="import-actions">
                <button className="btn primary" onClick={onImport} disabled={!pgnText.trim() || analysis.running}>
                  {analysis.running ? 'Analyzing…' : `Import & Analyze${previewGames.length > 1 ? ` (${previewGames.length} games)` : ''}`}
                </button>
                {showPreview ? (
                  <>
                    <button className="btn" onClick={() => setShowRaw(true)}>Edit PGN text</button>
                    <button
                      className="btn ghost"
                      onClick={() => { setPgnText(''); setShowRaw(false); setPreviewReady(false); setSelectedIdx(0); }}
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  pgnText.trim() !== '' &&
                  previewGames.length > 0 && (
                    <button className="btn" onClick={() => { setShowRaw(false); setPreviewReady(true); }}>
                      Show game details
                    </button>
                  )
                )}
                <button className="btn" onClick={() => fileRef.current?.click()}>Choose .pgn file</button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pgn,.txt,text/plain"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    onFile(e.target.files?.[0]);
                    e.target.value = ''; // allow re-choosing the same file
                  }}
                />
                <button className="btn ghost" onClick={onLoadSamples}>Load sample games</button>
              </div>
              {fileErrors && (
                <div className="notice error">
                  <strong>This file could not be read as PGN:</strong>
                  <ul>{fileErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
              {analysis.parseErrors.length > 0 && (
                <div className="notice error">
                  <strong>Some games could not be parsed:</strong>
                  <ul>{analysis.parseErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
              {analysis.notice && <div className="notice info">{analysis.notice}</div>}
              {analysis.engineStatus === 'error' && (
                <div className="notice error">
                  Engine failed to start: {analysis.engineError}. Make sure you are serving the app over http (not file://) so the Web Worker can load.
                </div>
              )}
            </div>
            <div className="how-it-works">
              <h3>How the diagnosis works</h3>
              <ol>
                <li>PGN games are parsed move by move.</li>
                <li>Every position is evaluated by Stockfish 19 NNUE (WASM).</li>
                <li>Moves are graded (best → blunder) by centipawn loss.</li>
                <li>Mistakes are matched to concrete patterns (hanging pieces, missed forks, ignored threats…).</li>
                <li>Patterns recurring across games become diagnoses with severity &amp; confidence.</li>
              </ol>
              <button className="btn ghost small" onClick={() => setShowLegend((v) => !v)}>
                {showLegend ? 'Hide' : 'Show'} move classification rules
              </button>
              {showLegend && (
                <ul className="legend">
                  {CLASSIFICATION_RULES_TEXT.map((r) => <li key={r}>{r}</li>)}
                </ul>
              )}
            </div>
          </div>
        </Section>
      )}

      {state.games.length === 0 ? (
        <EmptyState
          icon="🩺"
          title="The lab is empty"
          text="Import a PGN (or click “Load sample games”) and Chess Doctor will produce your first diagnosis: recurring weaknesses, supporting positions, and a training plan."
        />
      ) : (
        <>
          <Section
            title="Vitals"
            subtitle={
              state.settings.playerName
                ? `Player: ${state.settings.playerName}${d.gamesToTarget > 0 ? ` — ${d.gamesToTarget} more games until full diagnostic confidence.` : ' — diagnostic sample is strong.'}`
                : 'Set your player name in Settings so results are matched to your color.'
            }
          >
            <div className="stat-grid">
              <Stat label="Games analyzed" value={String(d.gamesAnalyzed)} sub={`${d.movesAnalyzed} moves`} />
              <div className="stat">
                <div className="stat-value">{d.diagnosticConfidence}%</div>
                <div className="stat-label">Diagnostic confidence</div>
                <div className="stat-sub">{d.confidenceLabel}</div>
                <ProgressBar value={d.diagnosticConfidence} tone={d.confidenceLabel === 'high' ? 'good' : 'accent'} />
              </div>
              <Stat
                label="Avg centipawn loss"
                value={String(Math.round(d.overall.avgCpl))}
                sub="lower is better"
                tone={d.overall.avgCpl < 50 ? 'good' : d.overall.avgCpl < 90 ? 'warn' : 'bad'}
              />
              <Stat
                label="Blunder rate"
                value={`${d.overall.blunderRate.toFixed(1)}%`}
                sub="of your moves"
                tone={d.overall.blunderRate < 2 ? 'good' : d.overall.blunderRate < 5 ? 'warn' : 'bad'}
              />
              <Stat
                label="Mistake rate"
                value={`${d.overall.mistakeRate.toFixed(1)}%`}
                tone={d.overall.mistakeRate < 3 ? 'good' : d.overall.mistakeRate < 6 ? 'warn' : 'bad'}
              />
              <Stat
                label="Inaccuracy rate"
                value={`${d.overall.inaccuracyRate.toFixed(1)}%`}
                tone={d.overall.inaccuracyRate < 6 ? 'good' : 'warn'}
              />
              <Stat label="Accuracy" value={`${d.overall.accuracy.toFixed(1)}%`} tone={d.overall.accuracy > 80 ? 'good' : 'neutral'} />
              <Stat label="Tactical accuracy" value={d.overall.tacticalAccuracy ? `${d.overall.tacticalAccuracy.toFixed(1)}%` : '—'} sub="sharp positions" />
              <Stat label="Strategic accuracy" value={d.overall.strategicAccuracy ? `${d.overall.strategicAccuracy.toFixed(1)}%` : '—'} sub="quiet positions" />
              <Stat label="Opening accuracy" value={d.overall.openingAccuracy ? `${d.overall.openingAccuracy.toFixed(1)}%` : '—'} />
              <Stat label="Endgame accuracy" value={d.overall.endgameAccuracy ? `${d.overall.endgameAccuracy.toFixed(1)}%` : '—'} />
              <div className="stat">
                <div className="stat-value">
                  {d.ratingTrend !== null ? `${d.ratingTrend >= 0 ? '+' : ''}${d.ratingTrend}` : '—'}
                </div>
                <div className="stat-label">Rating trend</div>
                {d.ratingSeries.length >= 2 && (
                  <div className="stat-sub">
                    <Sparkline values={d.ratingSeries.map((r) => r.elo)} color={d.ratingTrend !== null && d.ratingTrend < 0 ? 'var(--bad)' : 'var(--good)'} />
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Overall condition" subtitle="What the numbers say about your current play — only from games in the current filter.">
            <p className="condition-summary">{d.conditionSummary}</p>
          </Section>

          {d.diagnoses.length > 0 && (
            <Section
              title="Primary weaknesses"
              subtitle="Recurring problems backed by engine evidence across games. Click one to open its full diagnosis."
            >
              <div className="diagnosis-grid">
                {d.diagnoses.slice(0, 3).map((diag) => (
                  <button key={diag.id} className="diagnosis-card preview" onClick={() => openDiagnosis(diag)}>
                    <div className="diagnosis-card-head">
                      <h3>{diag.title}</h3>
                      <span className={`badge sev-${diag.severity}`}>{diag.severity}</span>
                    </div>
                    <p className="diag-evidence">Detected in {diag.affectedGames} of {d.gamesAnalyzed} games · {diag.frequency} positions · avg loss {(diag.averageEvalLoss / 100).toFixed(2)} pawns</p>
                    <p className="diag-pattern">{diag.typicalPattern}</p>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <div className="two-col">
            <Section title="Centipawn loss per game" subtitle="Lower is better. Each point is one analyzed game, oldest → newest.">
              <LineChart
                series={d.perGameSeries.map((s, i) => ({ x: i, y: s.cpl, label: `${s.label}: ${s.cpl}cp avg loss` }))}
                zeroLine={false}
                yFormat={(v) => String(Math.round(v))}
              />
            </Section>
            <Section title="Blunder rate per game" subtitle="% of moves that were blunders.">
              <LineChart
                series={d.perGameSeries.map((s, i) => ({ x: i, y: s.blunderRate, label: `${s.label}: ${s.blunderRate.toFixed(1)}% blunders` }))}
                color="var(--bad)"
                yFormat={(v) => `${Math.round(v)}%`}
              />
            </Section>
          </div>

          <div className="two-col">
            <Section title="Accuracy per game" subtitle="Lichess-style accuracy model.">
              <LineChart
                series={d.perGameSeries.map((s, i) => ({ x: i, y: s.accuracy, label: `${s.label}: ${s.accuracy.toFixed(1)}%` }))}
                color="var(--good)"
                yFormat={(v) => `${Math.round(v)}%`}
              />
            </Section>
            <Section title="Opening profile" subtitle="Where your openings differ.">
              {d.openings.length === 0 ? (
                <p className="muted">No opening data (add ECO/Opening tags to your PGNs).</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Opening</th><th>Games</th><th>Accuracy</th><th>Avg CPL</th><th>Score</th></tr>
                  </thead>
                  <tbody>
                    {d.openings.slice(0, 6).map((o) => (
                      <tr key={o.name}>
                        <td>{o.name}</td>
                        <td>{o.games}</td>
                        <td>{o.accuracy.toFixed(1)}%</td>
                        <td>{Math.round(o.avgCpl)}</td>
                        <td>{o.scorePct.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </div>

          {topEvidence && d.diagnoses.length > 0 && (
            <Section title="Most damaging recent example" subtitle={`From the diagnosis “${d.diagnoses[0].title}” — the position where the largest evaluation loss occurred.`}>
              <div className="example-grid">
                <Board
                  fen={topEvidence.fenBefore}
                  lastMove={null}
                  className="medium"
                />
                <div>
                  <p className="diag-detail">{topEvidence.detail}</p>
                  <p className="muted">
                    Move {topEvidence.moveNumber} ({topEvidence.color}) — played <strong>{topEvidence.san}</strong>,
                    engine preferred <strong>{topEvidence.bestMoveSan}</strong> (−{(topEvidence.evalLoss / 100).toFixed(2)} pawns).
                  </p>
                  <button className="btn" onClick={() => store.openPosition(topEvidence.gameId, topEvidence.ply)}>
                    Open in Game Explorer
                  </button>
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      {picker && (
        <GamePickerModal
          games={picker.games}
          errors={picker.errors}
          fileName={picker.fileName}
          onCancel={() => setPicker(null)}
          onConfirm={onPickerConfirm}
        />
      )}
    </>
  );
}

function playerColorOf(game: ParsedGame, youName: string): 'white' | 'black' | null {
  const name = youName.trim().toLowerCase();
  if (!name) return null;
  if (game.info.white.trim().toLowerCase() === name) return 'white';
  if (game.info.black.trim().toLowerCase() === name) return 'black';
  return null;
}

/** Win/loss/draw relative to the configured player, like the Game Explorer list. */
function chipFor(game: ParsedGame, youName: string): 'win' | 'loss' | 'draw' | '' {
  const color = playerColorOf(game, youName);
  if (!color) return '';
  const r = game.info.result;
  if (r === '1/2-1/2') return 'draw';
  if (r === '*') return '';
  return (r === '1-0') === (color === 'white') ? 'win' : 'loss';
}

const CHIP_LETTER: Record<string, string> = { win: 'W', loss: 'L', draw: 'D' };

/** Readable game card shown in place of the raw PGN text. */
function GameDetails({ game, youName }: { game: ParsedGame; youName: string }) {
  const i = game.info;
  const youColor = playerColorOf(game, youName);
  const resultText =
    i.result === '1-0' ? 'White wins' : i.result === '0-1' ? 'Black wins' : i.result === '1/2-1/2' ? 'Draw' : 'Unfinished';
  const moves = Math.ceil(game.plies.length / 2);
  let openingLine = '';
  for (const p of game.plies.slice(0, 12)) {
    openingLine += p.color === 'white' ? `${p.moveNumber}. ${p.san} ` : `${p.san} `;
  }
  return (
    <div className="game-details">
      <div className="gd-players">
        <div className="gd-player">
          <span className="gd-dot white" aria-hidden />
          <div className="gd-who">
            <span className="gd-name">
              {i.white}
              {youColor === 'white' && <span className="gd-you">you</span>}
            </span>
            <span className="gd-elo">{i.whiteElo ? `${i.whiteElo} Elo` : '\u00a0'}</span>
          </div>
        </div>
        <div className="gd-vs">
          <span className="gd-result">{i.result}</span>
          <span className="gd-result-text">{resultText}</span>
        </div>
        <div className="gd-player black-side">
          <span className="gd-dot black" aria-hidden />
          <div className="gd-who">
            <span className="gd-name">
              {i.black}
              {youColor === 'black' && <span className="gd-you">you</span>}
            </span>
            <span className="gd-elo">{i.blackElo ? `${i.blackElo} Elo` : '\u00a0'}</span>
          </div>
        </div>
      </div>
      <dl className="gd-meta">
        <div><dt>Date</dt><dd>{i.date ?? '—'}</dd></div>
        <div><dt>Event</dt><dd>{i.event ?? '—'}</dd></div>
        <div><dt>Time control</dt><dd>{i.timeControlKind}{i.timeControl ? ` (${i.timeControl})` : ''}</dd></div>
        <div><dt>Opening</dt><dd>{i.eco ? `${i.eco} ` : ''}{i.opening ?? '—'}</dd></div>
        <div><dt>Termination</dt><dd>{i.termination ?? '—'}</dd></div>
        <div><dt>Length</dt><dd>{moves} move{moves === 1 ? '' : 's'}</dd></div>
      </dl>
      {openingLine && <p className="gd-moves">{openingLine}…</p>}
    </div>
  );
}
