// TrainingGenerator — builds a personalised, day-by-day training program for
// every major diagnosis, anchored to the player's own flagged positions.

import type { ChessDiagnosis, TrainingPlan } from './types';
import { PATTERN_META } from './explain';

export function buildTrainingPlan(d: ChessDiagnosis): TrainingPlan {
  const meta = PATTERN_META[d.id as keyof typeof PATTERN_META];
  const evidence = d.evidence;
  const n = Math.min(10, d.affectedPositions);
  const top3 = evidence.slice(0, 3);

  const day1 = {
    label: 'Day 1 — See the pattern',
    focus: `Re-recognise the exact shape of this weakness (${d.title}).`,
    tasks: [
      { text: `Review ${Math.min(4, evidence.length)} of your own flagged positions below — for each, name the problem BEFORE revealing the engine's move.`, done: false },
      ...top3.map((e) => ({
        text: `Position study: move ${e.moveNumber} (${e.san}) — ${e.gameLabel}`,
        done: false,
        gameId: e.gameId,
        ply: e.ply,
      })),
    ],
  };

  const day2 = {
    label: 'Day 2 — Drill the skill',
    focus: meta?.trainingIdea ?? 'Targeted exercises for this weakness.',
    tasks: [
      { text: `Solve ${Math.min(10, n)} Chess Doctor puzzles from this diagnosis (Puzzles tab, filter: ${d.title}).`, done: false },
      { text: 'For every puzzle: first say the opponent\'s threat out loud, only then look for your move.', done: false },
    ],
  };

  const day3 = {
    label: 'Day 3 — Understand the principle',
    focus: meta?.principle ?? 'Understand why this keeps happening.',
    tasks: [
      { text: `Write down, in one sentence, the decision rule that would have prevented your ${Math.min(n, d.affectedPositions)} flagged positions.`, done: false },
      { text: 'Pick 2 of the evidence positions and find the alternative plan that keeps the evaluation stable.', done: false },
    ],
  };

  const day4 = {
    label: 'Day 4 — Apply under pressure',
    focus: 'Use the new habit in real games with a pre-move checklist.',
    tasks: [
      { text: 'Play 1–2 games at your usual time control, applying the decision rule from Day 3.', done: false },
      { text: 'Before every move: opponent checks → captures → threats. Note where you skipped the ritual.', done: false },
    ],
  };

  const day5 = {
    label: 'Day 5 — Re-test',
    focus: 'Measure whether the weakness actually improved.',
    tasks: [
      { text: 'Import a fresh game into Chess Doctor and compare the pattern count against your baseline.', done: false },
      { text: 'If the pattern still appears ≥ 2 times, repeat Day 2 with harder puzzles.', done: false },
    ],
  };

  return {
    diagnosisId: d.id,
    title: `Training plan — ${d.title}`,
    days: [day1, day2, day3, day4, day5],
  };
}

export function buildAllTrainingPlans(diagnoses: ChessDiagnosis[]): TrainingPlan[] {
  return diagnoses
    .filter((d) => d.severity !== 'stable')
    .slice(0, 5)
    .map(buildTrainingPlan);
}
