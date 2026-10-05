// Diagnosis cards — every claim is backed by frequency, affected games,
// average evaluation loss, and clickable evidence positions.

import { useState } from 'react';
import { useStore } from '../App';
import Board from './Board';
import { CategoryTag, ConfidenceBadge, EmptyState, Section, SeverityBadge, fmtEval } from './bits';
import type { ChessDiagnosis } from '../core/types';
import { PATTERN_META } from '../core/explain';

export function DiagnosesView() {
  const store = useStore();
  const d = store.dashboard;
  const [expanded, setExpanded] = useState<string | null>(d.diagnoses[0]?.id ?? null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const all = [...d.diagnoses, ...d.secondaryDiagnoses];
  const shown = severityFilter === 'all' ? all : all.filter((x) => x.severity === severityFilter);

  if (all.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No diagnoses yet"
        text="Diagnoses need recurring evidence — at least a few instances across at least two games. Import and analyze more games, or loosen the filters."
      />
    );
  }

  return (
    <>
      <Section
        title="Your diagnoses"
        subtitle={`Sorted by severity. The engine's numbers are the facts; the explanation layer only translates them. ${store.playerName ? `Filter: ${store.state.filters.phase === 'all' ? 'all phases' : store.state.filters.phase}` : ''}`}
        right={
          <div className="chip-row">
            {['all', 'critical', 'significant', 'moderate', 'mild'].map((s) => (
              <button key={s} className={`chip ${severityFilter === s ? 'active' : ''}`} onClick={() => setSeverityFilter(s)}>
                {s}
              </button>
            ))}
          </div>
        }
      >
        <div className="diagnosis-list">
          {shown.map((diag) => (
            <DiagnosisCard
              key={diag.id}
              diag={diag}
              gamesTotal={d.gamesAnalyzed}
              expanded={expanded === diag.id}
              onToggle={() => setExpanded(expanded === diag.id ? null : diag.id)}
              onOpenGame={store.openPosition}
              onGoPuzzles={() => store.setTab('puzzles')}
              onGoTraining={() => store.setTab('training')}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

function DiagnosisCard({
  diag,
  gamesTotal,
  expanded,
  onToggle,
  onOpenGame,
  onGoPuzzles,
  onGoTraining,
}: {
  diag: ChessDiagnosis;
  gamesTotal: number;
  expanded: boolean;
  onToggle: () => void;
  onOpenGame: (gameId: string, ply: number) => void;
  onGoPuzzles: () => void;
  onGoTraining: () => void;
}) {
  const meta = PATTERN_META[diag.id as keyof typeof PATTERN_META];
  const example = diag.evidence[0];

  return (
    <article id={`diag-${diag.id}`} className={`diagnosis-card sev-border-${diag.severity} ${expanded ? 'expanded' : ''}`}>
      <button className="diagnosis-card-head clickable" onClick={onToggle} aria-expanded={expanded}>
        <div>
          <h3>{diag.title}</h3>
          <div className="badge-row">
            <CategoryTag category={diag.category} />
            <SeverityBadge severity={diag.severity} />
            <ConfidenceBadge level={diag.confidence} />
          </div>
        </div>
        <span className="expand-arrow">{expanded ? '▾' : '▸'}</span>
      </button>

      <div className="diagnosis-meta">
        <div className="meta-block">
          <div className="meta-value">{diag.affectedGames}/{gamesTotal}</div>
          <div className="meta-label">games affected</div>
        </div>
        <div className="meta-block">
          <div className="meta-value">{diag.frequency}</div>
          <div className="meta-label">flagged positions</div>
        </div>
        <div className="meta-block">
          <div className="meta-value">{(diag.averageEvalLoss / 100).toFixed(2)}</div>
          <div className="meta-label">avg eval loss (pawns)</div>
        </div>
        <div className="meta-block">
          <div className={`meta-value trend-${diag.trend}`}>{trendLabel(diag.trend)}</div>
          <div className="meta-label">trend</div>
        </div>
      </div>

      {expanded && (
        <div className="diagnosis-body">
          <p><strong>Typical pattern.</strong> {diag.typicalPattern}</p>
          <p><strong>What you should notice.</strong> {diag.whatToNotice}</p>
          <p><strong>Principle.</strong> {meta?.principle}</p>

          {example && (
            <div className="example-grid">
              <Board fen={example.fenBefore} className="mini-board medium" coordinates />
              <div>
                <h4>Example — move {example.moveNumber} ({example.color})</h4>
                <p className="diag-detail">{example.detail}</p>
                <p className="muted">
                  Played <span className={`san played`}>{example.san}</span> ({fmtEvalLoss(example.evalLoss)}) ·
                  Best was <span className="san best">{example.bestMoveSan}</span>
                </p>
                <button className="btn small" onClick={() => onOpenGame(example.gameId, example.ply)}>
                  Open position in Game Explorer
                </button>
              </div>
            </div>
          )}

          <h4>Evidence — all supporting positions</h4>
          <div className="evidence-list">
            {diag.evidence.map((e) => (
              <button key={`${e.gameId}-${e.ply}`} className="evidence-row" onClick={() => onOpenGame(e.gameId, e.ply)}>
                <Board fen={e.fenBefore} className="mini" coordinates={false} />
                <div className="evidence-text">
                  <div className="evidence-head">
                    <strong>{e.gameLabel}</strong>
                    <span className="muted"> · move {e.moveNumber} ({e.color})</span>
                    <span className="loss-chip">−{(e.evalLoss / 100).toFixed(2)}</span>
                  </div>
                  <p>{e.detail}</p>
                </div>
              </button>
            ))}
          </div>

          <h4>Recommended training</h4>
          <ul className="rec-list">
            {diag.recommendations.map((r) => (
              <li key={r.title}>
                <strong>{r.title}.</strong> {r.description}
              </li>
            ))}
          </ul>
          <div className="btn-row">
            <button className="btn primary small" onClick={onGoPuzzles}>Practice as puzzles</button>
            <button className="btn small" onClick={onGoTraining}>Open 5-day training plan</button>
          </div>
        </div>
      )}
    </article>
  );
}

function trendLabel(t: ChessDiagnosis['trend']): string {
  switch (t) {
    case 'improving': return '↗ improving';
    case 'worsening': return '↘ worsening';
    case 'stable': return '→ stable';
    default: return '? not enough data';
  }
}

function fmtEvalLoss(cp: number): string {
  return `−${(cp / 100).toFixed(2)} pawns`;
}
