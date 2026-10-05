import type { MoveClassification } from './types';

/**
 * All quantitative thresholds in one place — the UI never hard-codes them.
 * Every label shown to the user (best/blunder, severity, confidence…) is
 * derived from these documented numbers.
 */
export interface DoctorConfig {
  /** Stockfish search depth used by the analysis pipeline. */
  depth: number;
  /** Hard wall-clock cap for a single position analysis (ms), as a safety net. */
  perPositionTimeoutMs: number;
  /**
   * Classification thresholds: a move is graded by its centipawn loss vs the
   * engine best move. A move equal to the engine choice is always "best".
   * (cp thresholds, upper bounds)
   */
  classification: Record<Exclude<MoveClassification, 'best'>, number>;
  /** Critical position detection. */
  critical: {
    /** Centipawn loss that flags a moment as critical. */
    cpl: number;
    /** Absolute evaluation swing (cp) that flags a moment as critical. */
    swing: number;
  };
  /** Recurrence rules — a diagnosis is never made from isolated incidents. */
  diagnosis: {
    /** Minimum pattern occurrences before a diagnosis can exist. */
    minInstances: number;
    /** Minimum number of different games affected. */
    minGames: number;
    /** Target number of games for "full" diagnostic confidence. */
    gamesTarget: number;
  };
  /** Severity scoring weights (all inputs normalised to 0..1). */
  severity: {
    frequencyWeight: number; // occurrences relative to moves played
    lossWeight: number; // average eval loss relative to 500cp
    gamesWeight: number; // fraction of games affected
    critical: number; // score thresholds for severity labels
    significant: number;
    moderate: number;
    mild: number;
  };
  /** Puzzle generation: minimum eval loss for a mistake to become a puzzle. */
  puzzleMinLoss: number;
}

export const DEFAULT_CONFIG: DoctorConfig = {
  depth: 14,
  perPositionTimeoutMs: 30000,
  classification: {
    excellent: 25,
    good: 60,
    inaccuracy: 120,
    mistake: 250,
    blunder: Infinity,
  },
  critical: {
    cpl: 120,
    swing: 150,
  },
  diagnosis: {
    minInstances: 3,
    minGames: 2,
    gamesTarget: 20,
  },
  severity: {
    frequencyWeight: 0.3,
    lossWeight: 0.4,
    gamesWeight: 0.3,
    critical: 0.68,
    significant: 0.5,
    moderate: 0.33,
    mild: 0.18,
  },
  puzzleMinLoss: 200,
};

/** Human-readable classification definitions, for the UI. */
export const CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
  best: 'Best move',
  excellent: 'Excellent',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

/** Classification → cp-loss boundary text used in tooltips/legends. */
export const CLASSIFICATION_RULES_TEXT = [
  'Best — identical to the engine choice',
  `Excellent — loses ≤ ${DEFAULT_CONFIG.classification.excellent}cp`,
  `Good — loses ≤ ${DEFAULT_CONFIG.classification.good}cp`,
  `Inaccuracy — loses ≤ ${DEFAULT_CONFIG.classification.inaccuracy}cp`,
  `Mistake — loses ≤ ${DEFAULT_CONFIG.classification.mistake}cp`,
  'Blunder — loses more than a mistake',
];
