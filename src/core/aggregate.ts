// DiagnosisEngine + EvidenceAggregator — aggregate pattern evidence across
// many games into recurring diagnoses. No diagnosis is ever made from a
// single incident: config.diagnosis.minInstances / minGames gate everything.

import { DEFAULT_CONFIG, type DoctorConfig } from './config';
import { PATTERN_META } from './explain';
import { mean } from './accuracy';
import type {
  ChessDiagnosis,
  Color,
  DashboardData,
  DiagnosisEvidence,
  Filters,
  GameAnalysis,
  OpeningRow,
  PatternInstance,
  PlayerGameMetrics,
  TrainingRecommendation,
} from './types';
import { buildTrainingPlan } from './training';
import { gameLabel } from './pgn';

/** Metrics of the configured player in a game (falls back to white). */
export function playerMetrics(g: GameAnalysis, playerName: string): PlayerGameMetrics {
  if (playerName) {
    if (g.info.playerColor === 'black') return g.metrics.black;
    if (g.info.playerColor === 'white') return g.metrics.white;
  }
  // Unknown player: combine both sides so the dashboard still has data.
  return combineMetrics(g.metrics.white, g.metrics.black);
}

function combineMetrics(a: PlayerGameMetrics, b: PlayerGameMetrics): PlayerGameMetrics {
  const moves = a.moves + b.moves;
  if (moves === 0) return a;
  const mix = (x: number, y: number) => (x * a.moves + y * b.moves) / moves;
  const mixOpt = (x: number | null, y: number | null): number | null => {
    if (x === null && y === null) return null;
    if (x === null) return y;
    if (y === null) return x;
    return mix(x, y);
  };
  return {
    moves,
    avgCpl: mix(a.avgCpl, b.avgCpl),
    blunders: a.blunders + b.blunders,
    mistakes: a.mistakes + b.mistakes,
    inaccuracies: a.inaccuracies + b.inaccuracies,
    accuracy: mix(a.accuracy, b.accuracy),
    openingAccuracy: mixOpt(a.openingAccuracy, b.openingAccuracy),
    middlegameAccuracy: mixOpt(a.middlegameAccuracy, b.middlegameAccuracy),
    endgameAccuracy: mixOpt(a.endgameAccuracy, b.endgameAccuracy),
    tacticalAccuracy: mixOpt(a.tacticalAccuracy, b.tacticalAccuracy),
    strategicAccuracy: mixOpt(a.strategicAccuracy, b.strategicAccuracy),
    timeTrouble: a.timeTrouble || b.timeTrouble,
  };
}

export function applyFilters(games: GameAnalysis[], filters: Filters, playerName: string): GameAnalysis[] {
  return games.filter((g) => {
    if (filters.timeControl !== 'all' && g.info.timeControlKind !== filters.timeControl) return false;
    if (filters.opening !== 'all') {
      const label = openingLabel(g);
      if (label !== filters.opening) return false;
    }
    if (filters.dateFrom && (!g.info.date || g.info.date < filters.dateFrom.replace(/-/g, '.'))) return false;
    if (filters.dateTo && (!g.info.date || g.info.date > filters.dateTo.replace(/-/g, '.'))) return false;
    // color filter only applies when we know who the player is
    if (filters.color !== 'both' && playerName) {
      if (g.info.playerColor !== filters.color) return false;
    }
    return true;
  });
}

/** Filter pattern instances to a phase (used by phase-specific views). */
export function instancesForPhase(games: GameAnalysis[], phase: Filters['phase']): PatternInstance[] {
  const all = games.flatMap((g) => g.instances);
  if (phase === 'all') return all;
  return all.filter((i) => i.phase === phase);
}

export function openingLabel(g: GameAnalysis): string {
  if (g.info.eco && g.info.opening) return `${g.info.eco} ${g.info.opening}`;
  if (g.info.opening) return g.info.opening;
  if (g.info.eco) return g.info.eco;
  return 'Unknown opening';
}

function severityOf(
  frequency: number,
  affectedGames: number,
  avgLoss: number,
  totalMoves: number,
  totalGames: number,
  config: DoctorConfig
): ChessDiagnosis['severity'] {
  const freqNorm = Math.min(1, frequency / Math.max(4, totalMoves * 0.06));
  const lossNorm = Math.min(1, avgLoss / 500);
  const gamesNorm = totalGames > 0 ? Math.min(1, affectedGames / Math.max(3, totalGames * 0.4)) : 0;
  const score =
    freqNorm * config.severity.frequencyWeight +
    lossNorm * config.severity.lossWeight +
    gamesNorm * config.severity.gamesWeight;
  if (score >= config.severity.critical) return 'critical';
  if (score >= config.severity.significant) return 'significant';
  if (score >= config.severity.moderate) return 'moderate';
  if (score >= config.severity.mild) return 'mild';
  return 'stable';
}

function confidenceOf(affectedGames: number, frequency: number): ChessDiagnosis['confidence'] {
  if (affectedGames >= 6 && frequency >= 8) return 'high';
  if (affectedGames >= 3) return 'medium';
  return 'low';
}

function trendOf(instances: PatternInstance[], gamesCount: number): ChessDiagnosis['trend'] {
  if (gamesCount < 6) return 'insufficient_data';
  // Instances arrive in chronological order (games sorted by importedAt,
  // plies in move order within a game) — first half vs second half.
  const mid = Math.floor(instances.length / 2);
  const older = instances.slice(0, mid).length;
  const recent = instances.length - mid;
  if (recent > older * 1.25 + 1) return 'worsening';
  if (recent < older * 0.75 - 1) return 'improving';
  return 'stable';
}

/** A pattern instance only counts toward the player's diagnosis when it was their own move. */
function instanceIsPlayer(g: GameAnalysis, inst: PatternInstance, playerName: string): boolean {
  if (playerName && g.info.playerColor) return inst.color === g.info.playerColor;
  return true; // no known player → combined mode (both colors)
}

export function computeDiagnoses(
  games: GameAnalysis[],
  phaseFilter: Filters['phase'],
  config: DoctorConfig = DEFAULT_CONFIG,
  playerName = ''
): ChessDiagnosis[] {
  const totalGames = games.length;
  if (totalGames === 0) return [];
  const totalMoves = games.reduce((a, g) => a + g.moves.length, 0);

  // chronological order for trend detection
  const chrono = [...games].sort((a, b) => a.importedAt - b.importedAt);
  const gameIndex = new Map<string, number>();
  chrono.forEach((g, i) => gameIndex.set(g.id, i));

  const byPattern = new Map<PatternInstance['patternId'], PatternInstance[]>();
  for (const g of chrono) {
    for (const inst of g.instances) {
      if (phaseFilter !== 'all' && inst.phase !== phaseFilter) continue;
      if (!instanceIsPlayer(g, inst, playerName)) continue;
      const list = byPattern.get(inst.patternId) ?? [];
      list.push(inst);
      byPattern.set(inst.patternId, list);
    }
  }

  const diagnoses: ChessDiagnosis[] = [];
  for (const [patternId, instances] of byPattern) {
    const gamesAffectedSet = new Set(instances.map((i) => i.gameId));
    const affectedGames = gamesAffectedSet.size;
    const frequency = instances.length;
    if (frequency < config.diagnosis.minInstances || affectedGames < config.diagnosis.minGames) continue;

    const avgLoss = instances.reduce((a, i) => a + i.evalLoss, 0) / frequency;
    const meta = PATTERN_META[patternId];

    const evidence: DiagnosisEvidence[] = instances
      .slice()
      .sort((a, b) => b.evalLoss - a.evalLoss)
      .slice(0, 8)
      .map((i) => {
        const g = games.find((x) => x.id === i.gameId);
        return {
          gameId: i.gameId,
          gameLabel: g ? gameLabel(g.info) : i.gameId,
          date: g?.info.date,
          ply: i.ply,
          moveNumber: i.moveNumber,
          color: i.color,
          san: i.san,
          fenBefore: i.fenBefore,
          fenAfter: i.fenAfter,
          bestMoveSan: i.bestMoveSan,
          evalLoss: i.evalLoss,
          detail: i.detail,
        };
      });

    const recommendations: TrainingRecommendation[] = [
      { type: 'puzzles', title: 'Solve your own mistakes', description: `${meta.trainingIdea} Chess Doctor has turned your ${frequency} flagged positions into puzzles — work through them in the Puzzles tab.` },
      { type: 'review', title: 'Replay the evidence', description: `Replay the affected positions from your games and name the correct idea before revealing the engine's move.` },
      { type: 'principle', title: 'Principle to internalise', description: meta.principle },
    ];

    diagnoses.push({
      id: patternId,
      category: meta.category,
      title: meta.title,
      severity: severityOf(frequency, affectedGames, avgLoss, totalMoves, totalGames, config),
      confidence: confidenceOf(affectedGames, frequency),
      frequency,
      affectedGames,
      affectedPositions: frequency,
      averageEvalLoss: avgLoss,
      trend: trendOf(instances, totalGames),
      evidence,
      recommendations,
      typicalPattern: meta.typicalPattern,
      whatToNotice: meta.whatToNotice,
    });
  }

  diagnoses.sort((a, b) => {
    const order = { critical: 0, significant: 1, moderate: 2, mild: 3, stable: 4 };
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return b.averageEvalLoss * Math.sqrt(b.frequency) - a.averageEvalLoss * Math.sqrt(a.frequency);
  });

  return diagnoses;
}

export function diagnosticConfidence(gamesCount: number, target: number): { value: number; label: 'low' | 'medium' | 'high' } {
  const value = Math.round(100 * (1 - Math.exp(-gamesCount / Math.max(4, target / 2.5))));
  const label = value >= 75 ? 'high' : value >= 45 ? 'medium' : 'low';
  return { value, label };
}

export function computeDashboard(
  games: GameAnalysis[],
  filters: Filters,
  playerName: string,
  config: DoctorConfig = DEFAULT_CONFIG
): DashboardData {
  const filtered = applyFilters(games, filters, playerName);
  const diagnoses = computeDiagnoses(filtered, filters.phase, config, playerName);
  const primary = diagnoses.filter((d) => d.severity === 'critical' || d.severity === 'significant');
  const secondary = diagnoses.filter((d) => d.severity === 'moderate' || d.severity === 'mild');

  const metricsList = filtered.map((g) => playerMetrics(g, playerName));
  const movesTotal = metricsList.reduce((a, m) => a + m.moves, 0);
  const wsum = (f: (m: PlayerGameMetrics) => number | null): number => {
    let sum = 0;
    let weight = 0;
    for (const m of metricsList) {
      const v = f(m);
      if (v !== null && m.moves > 0) {
        sum += v * m.moves;
        weight += m.moves;
      }
    }
    return weight > 0 ? sum / weight : 0;
  };

  const avgCpl = movesTotal > 0 ? metricsList.reduce((a, m) => a + m.avgCpl * m.moves, 0) / movesTotal : 0;
  const blunders = metricsList.reduce((a, m) => a + m.blunders, 0);
  const mistakes = metricsList.reduce((a, m) => a + m.mistakes, 0);
  const inaccuracies = metricsList.reduce((a, m) => a + m.inaccuracies, 0);

  // rating trend (player elo per game)
  const ratingSeries = filtered
    .filter((g) => g.info.playerElo !== undefined)
    .sort((a, b) => a.importedAt - b.importedAt)
    .map((g) => ({ gameId: g.id, label: gameLabel(g.info), elo: g.info.playerElo as number }));
  const ratingTrend =
    ratingSeries.length >= 2 ? ratingSeries[ratingSeries.length - 1].elo - ratingSeries[0].elo : null;

  const perGameSeries = filtered
    .slice()
    .sort((a, b) => a.importedAt - b.importedAt)
    .map((g) => {
      const m = playerMetrics(g, playerName);
      return {
        gameId: g.id,
        label: gameLabel(g.info),
        cpl: Math.round(m.avgCpl),
        blunderRate: m.moves > 0 ? (m.blunders / m.moves) * 100 : 0,
        accuracy: m.accuracy,
      };
    });

  // opening profile
  const byOpening = new Map<string, GameAnalysis[]>();
  for (const g of filtered) {
    const label = openingLabel(g);
    const list = byOpening.get(label) ?? [];
    list.push(g);
    byOpening.set(label, list);
  }
  const openings: OpeningRow[] = [];
  for (const [name, gs] of byOpening) {
    if (gs.length < 1) continue;
    const ms = gs.map((g) => playerMetrics(g, playerName));
    const moves = ms.reduce((a, m) => a + m.moves, 0);
    let score = 0;
    let decided = 0;
    for (const g of gs) {
      if (!g.info.resultForPlayer) continue;
      decided++;
      if (g.info.resultForPlayer === 'win') score += 1;
      else if (g.info.resultForPlayer === 'draw') score += 0.5;
    }
    openings.push({
      name,
      games: gs.length,
      avgCpl: moves > 0 ? ms.reduce((a, m) => a + m.avgCpl * m.moves, 0) / moves : 0,
      accuracy: moves > 0 ? ms.reduce((a, m) => a + m.accuracy * m.moves, 0) / moves : 0,
      scorePct: decided > 0 ? (score / decided) * 100 : 0,
      avgLossPerGame: moves > 0 ? ms.reduce((a, m) => a + (m.blunders + m.mistakes), 0) / gs.length : 0,
    });
  }
  openings.sort((a, b) => b.games - a.games);

  // before/after progress (first third vs last third, chronological)
  const chrono = perGameSeries;
  const n = chrono.length;
  const seg = (xs: typeof chrono) => ({
    cpl: mean(xs.map((x) => x.cpl)),
    blunder: mean(xs.map((x) => x.blunderRate)),
    acc: mean(xs.map((x) => x.accuracy)),
  });
  const segSize = Math.max(1, Math.floor(n / 3));
  const before = n >= 6 ? seg(chrono.slice(0, segSize)) : null;
  const after = n >= 6 ? seg(chrono.slice(n - segSize)) : null;
  const beforeAfter = [
    { metric: 'Average centipawn loss', before: before?.cpl ?? 0, after: after?.cpl ?? 0, unit: 'cp', sufficient: n >= 6 },
    { metric: 'Blunder rate', before: before?.blunder ?? 0, after: after?.blunder ?? 0, unit: '%', sufficient: n >= 6 },
    { metric: 'Accuracy', before: before?.acc ?? 0, after: after?.acc ?? 0, unit: '%', sufficient: n >= 6 },
  ];

  const conf = diagnosticConfidence(filtered.length, config.diagnosis.gamesTarget);
  const data: DashboardData = {
    gamesAnalyzed: filtered.length,
    movesAnalyzed: movesTotal,
    diagnosticConfidence: conf.value,
    confidenceLabel: conf.label,
    gamesToTarget: Math.max(0, config.diagnosis.gamesTarget - filtered.length),
    overall: {
      avgCpl,
      blunderRate: movesTotal > 0 ? (blunders / movesTotal) * 100 : 0,
      mistakeRate: movesTotal > 0 ? (mistakes / movesTotal) * 100 : 0,
      inaccuracyRate: movesTotal > 0 ? (inaccuracies / movesTotal) * 100 : 0,
      accuracy: wsum((m) => m.accuracy),
      tacticalAccuracy: wsum((m) => m.tacticalAccuracy),
      strategicAccuracy: wsum((m) => m.strategicAccuracy),
      openingAccuracy: wsum((m) => m.openingAccuracy),
      endgameAccuracy: wsum((m) => m.endgameAccuracy),
    },
    ratingSeries,
    ratingTrend,
    perGameSeries,
    conditionSummary: conditionSummary(filtered, metricsList, primary, playerName),
    openings,
    diagnoses: primary,
    secondaryDiagnoses: secondary,
    strengths: strengthsOf(diagnoses, metricsList, filtered),
    beforeAfter,
  };
  return data;
}

function conditionSummary(
  games: GameAnalysis[],
  metrics: PlayerGameMetrics[],
  primary: ChessDiagnosis[],
  _playerName: string
): string {
  if (games.length === 0) {
    return 'No analyzed games in the current filter. Import PGN games and run the engine analysis to get your first diagnosis.';
  }
  const moves = metrics.reduce((a, m) => a + m.moves, 0);
  const blunders = metrics.reduce((a, m) => a + m.blunders, 0);
  const avgCpl = moves > 0 ? metrics.reduce((a, m) => a + m.avgCpl * m.moves, 0) / moves : 0;
  const acc = moves > 0 ? metrics.reduce((a, m) => a + m.accuracy * m.moves, 0) / moves : 0;
  const top = primary.slice(0, 2).map((d) => d.title.toLowerCase());

  const profile =
    avgCpl < 40 ? 'clean and consistent'
    : avgCpl < 70 ? 'solid with occasional lapses'
    : avgCpl < 110 ? 'error-prone in complex moments'
    : 'fighting frequent tactical losses';

  const lines: string[] = [];
  lines.push(
    `Across ${games.length} analyzed game${games.length === 1 ? '' : 's'} (${moves} moves), your play is ${profile}: average accuracy ${acc.toFixed(1)}%, average centipawn loss ${Math.round(avgCpl)}, ${blunders} blunder${blunders === 1 ? '' : 's'} (${moves > 0 ? ((blunders / moves) * 100).toFixed(1) : '0.0'}% of moves).`
  );
  if (top.length > 0) {
    lines.push(`The dominant recurring problem is ${top.join(' and ')}. These are backed by engine evidence from multiple games, not isolated incidents.`);
  } else {
    lines.push('No statistically strong recurring weakness emerged in the current selection — add more games to sharpen the diagnosis.');
  }
  return lines.join(' ');
}

function strengthsOf(diagnoses: ChessDiagnosis[], metrics: PlayerGameMetrics[], games: GameAnalysis[]): string[] {
  const out: string[] = [];
  const weakIds = new Set(diagnoses.filter((d) => d.frequency >= 3).map((d) => d.id));
  const acc = (f: (m: PlayerGameMetrics) => number | null): number | null => {
    const xs = metrics.map(f).filter((v): v is number => v !== null);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const tactical = acc((m) => m.tacticalAccuracy);
  const opening = acc((m) => m.openingAccuracy);
  const endgame = acc((m) => m.endgameAccuracy);
  const middlegame = acc((m) => m.middlegameAccuracy);

  if (tactical !== null && tactical >= 82) out.push(`Tactical alertness is a relative strength (accuracy ${tactical.toFixed(1)}% in sharp positions).`);
  if (opening !== null && opening >= 82) out.push(`Your opening play is reliable (accuracy ${opening.toFixed(1)}%).`);
  if (endgame !== null && endgame >= 82) out.push(`Endgame technique holds up well (accuracy ${endgame.toFixed(1)}%).`);
  if (middlegame !== null && middlegame >= 82) out.push(`Middlegame handling is above your own bar (accuracy ${middlegame.toFixed(1)}%).`);
  if (!weakIds.has('endgame_conversion') && games.some((g) => g.moves.some((m) => m.phase === 'endgame'))) {
    out.push('No evidence of endgame conversion failures in the analyzed games.');
  }
  return out;
}

/** Per-game time-management context for the report. */
export function timeManagementNote(games: GameAnalysis[], playerName: string): string | null {
  const withClocks = games.filter((g) => g.moves.some((m) => m.secondsSpent !== undefined));
  if (withClocks.length === 0) return null;
  const trouble = withClocks.filter((g) => playerMetrics(g, playerName).timeTrouble);
  if (trouble.length === 0) return null;
  return `Time trouble appeared in ${trouble.length} of ${withClocks.length} clocked games — several costly moves were played with under 30 seconds on the clock.`;
}

export type { Color };
