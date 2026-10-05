// Hand-rolled SVG charts — no dependency weight, dark-lab styling.

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export function LineChart({
  series,
  height = 140,
  yFormat = (v: number) => String(Math.round(v)),
  zeroLine = false,
  color = 'var(--accent)',
}: {
  series: Point[];
  height?: number;
  yFormat?: (v: number) => string;
  zeroLine?: boolean;
  color?: string;
}) {
  if (series.length === 0) {
    return <div className="chart-empty">No data in the current filter.</div>;
  }
  const W = 560;
  const H = height;
  const padL = 34;
  const padR = 8;
  const padT = 10;
  const padB = 16;
  const ys = series.map((p) => p.y);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  if (zeroLine) {
    yMin = Math.min(yMin, 0);
    yMax = Math.max(yMax, 0);
  }
  if (yMax === yMin) {
    yMax += 1;
    yMin -= 1;
  }
  const span = yMax - yMin;
  yMin -= span * 0.08;
  yMax += span * 0.08;

  const sx = (i: number) => padL + (i / Math.max(1, series.length - 1)) * (W - padL - padR);
  const sy = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);

  const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${sx(series.length - 1).toFixed(1)},${H - padB} L${padL},${H - padB} Z`;

  const gridYs = [yMin + (yMax - yMin) * 0.1, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.9];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
      {gridYs.map((gy, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={sy(gy)} y2={sy(gy)} className="chart-grid" />
          <text x={padL - 4} y={sy(gy) + 3} className="chart-label" textAnchor="end">
            {yFormat(gy)}
          </text>
        </g>
      ))}
      {zeroLine && yMin < 0 && yMax > 0 && (
        <line x1={padL} x2={W - padR} y1={sy(0)} y2={sy(0)} className="chart-zero" />
      )}
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((p, i) => (
        <circle key={i} cx={sx(i)} cy={sy(p.y)} r={2.4} fill={color}>
          <title>{p.label ?? yFormat(p.y)}</title>
        </circle>
      ))}
    </svg>
  );
}

export function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="chart-empty tiny">—</span>;
  const W = 100;
  const H = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sx = (i: number) => (i / (values.length - 1)) * W;
  const sy = (v: number) => H - 3 - ((v - min) / Math.max(1e-9, max - min)) * (H - 6);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" role="img">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}
