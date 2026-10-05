// Small shared UI primitives.

import type { ReactNode } from 'react';
import type { ChessDiagnosis, MoveClassification } from '../core/types';
import { CLASSIFICATION_LABELS } from '../core/config';

export function ClassificationBadge({ c }: { c: MoveClassification }) {
  return (
    <span
      className={`badge cls-${c}`}
      title={CLASSIFICATION_LABELS[c]}
      aria-label={CLASSIFICATION_LABELS[c]}
    >
      {glyph(c)}
    </span>
  );
}

function glyph(c: MoveClassification): string {
  switch (c) {
    case 'best': return '★';
    case 'excellent': return '✓';
    case 'good': return '✓';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
  }
}

export function SeverityBadge({ severity }: { severity: ChessDiagnosis['severity'] }) {
  return <span className={`badge sev-${severity}`}>{severity}</span>;
}

export function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  return (
    <span className={`badge conf-${level}`} title="How much evidence supports this diagnosis">
      <span className="conf-dot" /> {level} confidence
    </span>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return <span className={`badge cat-${category}`}>{category}</span>;
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Section({ title, subtitle, children, right }: { title: string; subtitle?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="panel-sub">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = 'accent' }: { value: number; max?: number; tone?: 'accent' | 'good' | 'bad' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress">
      <div className={`progress-fill progress-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={wide ? 'modal wide' : 'modal'} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function fmtEval(cp: number): string {
  if (Math.abs(cp) >= 90000) {
    const n = Math.round((100000 - Math.abs(cp)) / 100);
    return `${cp > 0 ? '+' : '-'}M${Math.max(1, n)}`;
  }
  const v = cp / 100;
  return `${v > 0 ? '+' : v < 0 ? '' : '±'}${v.toFixed(2)}`;
}

export function fmtClock(seconds?: number): string | null {
  if (seconds === undefined) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
