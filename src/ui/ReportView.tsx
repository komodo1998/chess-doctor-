// Doctor Report — "Your Chess Diagnosis", print-friendly.

import type { ReactNode } from 'react';
import { useStore } from '../App';
import { Section, SeverityBadge } from './bits';
import { timeManagementNote } from '../core/aggregate';
import type { ChessDiagnosis } from '../core/types';

export function ReportView() {
  const store = useStore();
  const d = store.dashboard;
  const all = [...d.diagnoses, ...d.secondaryDiagnoses];
  const tactical = all.filter((x) => x.category === 'tactical');
  const opening = all.filter((x) => x.category === 'opening');
  const endgame = all.filter((x) => x.category === 'endgame');
  const middlegame = all.filter((x) => x.category === 'middlegame');
  const strategic = all.filter((x) => x.category === 'strategic');
  const decision = all.filter((x) => x.category === 'decision');
  const timeNote = timeManagementNote(store.filteredGames, store.playerName);

  return (
    <>
      <div className="report-actions no-print">
        <button className="btn primary" onClick={() => window.print()}>Print / save as PDF</button>
      </div>

      <div className="report">
        <header className="report-header">
          <h1>Your Chess Diagnosis</h1>
          <p className="muted">
            {store.playerName ? `Player: ${store.playerName} · ` : ''}
            {d.gamesAnalyzed} games · {d.movesAnalyzed} moves ·
            engine: Stockfish 19 NNUE at depth {store.config.depth} ·
            generated {new Date().toLocaleDateString()} ·
            diagnostic confidence {d.diagnosticConfidence}% ({d.confidenceLabel})
          </p>
        </header>

        <ReportSection title="Overall Condition">
          <p>{d.conditionSummary}</p>
          {timeNote && <p className="muted">{timeNote}</p>}
        </ReportSection>

        <ReportSection title="Primary Weaknesses">
          {d.diagnoses.length === 0 ? (
            <p className="muted">No statistically strong recurring weakness in the current selection.</p>
          ) : (
            d.diagnoses.map((diag) => <DiagnosisLine key={diag.id} diag={diag} />)
          )}
        </ReportSection>

        <ReportSection title="Secondary Weaknesses">
          {d.secondaryDiagnoses.length === 0 ? (
            <p className="muted">Nothing notable — or not enough data yet.</p>
          ) : (
            d.secondaryDiagnoses.map((diag) => <DiagnosisLine key={diag.id} diag={diag} />)
          )}
        </ReportSection>

        <ReportSection title="Strengths">
          {d.strengths.length === 0 ? (
            <p className="muted">No standout strengths in the current selection — usually a sign the sample is still small.</p>
          ) : (
            <ul>{d.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
          )}
        </ReportSection>

        <ReportSection title="Recurring Patterns">
          <table className="table">
            <thead>
              <tr><th>Pattern</th><th>Severity</th><th>Games</th><th>Positions</th><th>Avg loss</th><th>Trend</th></tr>
            </thead>
            <tbody>
              {all.map((diag) => (
                <tr key={diag.id}>
                  <td>{diag.title}</td>
                  <td><SeverityBadge severity={diag.severity} /></td>
                  <td>{diag.affectedGames}</td>
                  <td>{diag.frequency}</td>
                  <td>{(diag.averageEvalLoss / 100).toFixed(2)} pawns</td>
                  <td>{diag.trend}</td>
                </tr>
              ))}
              {all.length === 0 && <tr><td colSpan={6} className="muted">No recurring patterns detected yet.</td></tr>}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title="Opening Profile">
          {d.openings.length > 0 ? (
            <table className="table">
              <thead><tr><th>Opening</th><th>Games</th><th>Accuracy</th><th>Avg CPL</th><th>Score</th></tr></thead>
              <tbody>
                {d.openings.map((o) => (
                  <tr key={o.name}>
                    <td>{o.name}</td><td>{o.games}</td>
                    <td>{o.accuracy.toFixed(1)}%</td><td>{Math.round(o.avgCpl)}</td><td>{o.scorePct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No opening data available.</p>
          )}
          {opening.length > 0 && (
            <ul>{opening.map((diag) => <li key={diag.id}><strong>{diag.title}</strong> — {diagLine(diag)}</li>)}</ul>
          )}
        </ReportSection>

        <ReportSection title="Middlegame Profile">
          <p className="muted">
            Middlegame accuracy: {d.overall.strategicAccuracy ? `${d.overall.strategicAccuracy.toFixed(1)}% in quiet positions` : '—'},
            tactical accuracy {d.overall.tacticalAccuracy ? `${d.overall.tacticalAccuracy.toFixed(1)}% in sharp positions` : '—'}.
          </p>
          {[...middlegame, ...strategic, ...decision].length > 0 ? (
            <ul>{[...middlegame, ...strategic, ...decision].map((diag) => <li key={diag.id}><strong>{diag.title}</strong> — {diagLine(diag)}</li>)}</ul>
          ) : (
            <p className="muted">No recurring middlegame issues in the current selection.</p>
          )}
        </ReportSection>

        <ReportSection title="Endgame Profile">
          <p className="muted">Endgame accuracy: {d.overall.endgameAccuracy ? `${d.overall.endgameAccuracy.toFixed(1)}%` : 'not enough endgames yet'}.</p>
          {endgame.length > 0 ? (
            <ul>{endgame.map((diag) => <li key={diag.id}><strong>{diag.title}</strong> — {diagLine(diag)}</li>)}</ul>
          ) : (
            <p className="muted">No recurring endgame issues in the current selection.</p>
          )}
        </ReportSection>

        <ReportSection title="Tactical Profile">
          {tactical.length > 0 ? (
            <ul>{tactical.map((diag) => <li key={diag.id}><strong>{diag.title}</strong> — {diagLine(diag)}</li>)}</ul>
          ) : (
            <p className="muted">No recurring tactical issues in the current selection.</p>
          )}
        </ReportSection>

        <ReportSection title="Improvement Plan">
          <ol className="plan-list">
            {all.filter((x) => x.severity !== 'stable').slice(0, 5).map((diag, i) => (
              <li key={diag.id}>
                <strong>{i + 1}. {diag.title}</strong> — {diag.whatToNotice}
                <div className="muted">Train: {diag.recommendations[0]?.description}</div>
              </li>
            ))}
            {all.filter((x) => x.severity !== 'stable').length === 0 && (
              <li className="muted">Keep playing and importing games — the plan appears once recurring patterns exist.</li>
            )}
          </ol>
          <div className="no-print">
            <button className="btn" onClick={() => store.setTab('training')}>Open full day-by-day training plans</button>
          </div>
        </ReportSection>

        <footer className="report-footer muted">
          All findings above are derived from the analyzed games only. Diagnoses require at least{' '}
          {store.config.diagnosis.minInstances} occurrences across at least {store.config.diagnosis.minGames} games; anything less is
          reported as low confidence or omitted. This is a chess-performance diagnostic — not a psychological or medical assessment.
        </footer>
      </div>
    </>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="report-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function diagLine(diag: ChessDiagnosis): string {
  return `seen in ${diag.affectedGames} game${diag.affectedGames === 1 ? '' : 's'} over ${diag.frequency} positions, avg loss ${(diag.averageEvalLoss / 100).toFixed(2)} pawns (${diag.severity}, ${diag.confidence} confidence)`;
}

function DiagnosisLine({ diag }: { diag: ChessDiagnosis }) {
  return (
    <div className="report-diag">
      <h3>{diag.title} <SeverityBadge severity={diag.severity} /></h3>
      <p>
        Detected in {diag.affectedGames} game{diag.affectedGames === 1 ? '' : 's'} · {diag.frequency} positions ·
        average loss {(diag.averageEvalLoss / 100).toFixed(2)} pawns · {diag.confidence} confidence · trend {diag.trend}.
      </p>
      <p>{diag.typicalPattern}</p>
    </div>
  );
}
