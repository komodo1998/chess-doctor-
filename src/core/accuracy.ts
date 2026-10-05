// Accuracy metric — the win-probability conversion and per-move accuracy formula
// used by Lichess (open source: lila, modules/analyse — accuracy model).
// We reuse it so Chess Doctor numbers feel familiar to Lichess users.

const MAX_CP = 1500; // clamp evaluations for stable win% math

export function winPercent(cpWhite: number): number {
  const cp = Math.max(-MAX_CP, Math.min(MAX_CP, cpWhite));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Lichess per-move accuracy from the mover's perspective (win% before → after). */
export function moveAccuracy(cpBeforeMover: number, cpAfterMover: number): number {
  const winBefore = winPercent(cpBeforeMover);
  const winAfter = winPercent(cpAfterMover);
  const drop = Math.max(0, winBefore - winAfter);
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
