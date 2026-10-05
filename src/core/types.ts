// Core domain types for Chess Doctor.
// The engine (Stockfish) is the source of chess truth; these types carry that
// evidence through classification → pattern detection → diagnosis → UI.

export type Color = 'white' | 'black';
export type OpponentColor = 'w' | 'b';
export type GamePhase = 'opening' | 'middlegame' | 'endgame';

export type MoveClassification =
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface EngineLine {
  multipv: number;
  depth: number;
  /** Evaluation in centipawns from White's point of view. Mate scores are capped. */
  cpWhite: number;
  /** > 0: White mates in N. < 0: Black mates in N. null: no mate found. */
  mateIn: number | null;
  pvUci: string[];
}

export interface EngineEval {
  fen: string;
  depth: number;
  bestMoveUci: string;
  cpWhite: number;
  mateIn: number | null;
  pvUci: string[];
  lines: EngineLine[];
}

/** One raw per-ply record straight out of the PGN, before engine analysis. */
export interface PlyRecord {
  ply: number; // 1-based
  moveNumber: number;
  color: Color;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  capture: boolean;
  check: boolean;
  /** Seconds elapsed for this move (from PGN %clk comments), if available. */
  secondsSpent?: number;
}

export interface GameInfo {
  white: string;
  black: string;
  whiteElo?: number;
  blackElo?: number;
  result: string; // '1-0' | '0-1' | '1/2-1/2' | '*'
  date?: string; // YYYY.MM.DD
  event?: string;
  timeControl?: string;
  timeControlKind: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'unknown';
  eco?: string;
  opening?: string;
  termination?: string;
  /** Which color the configured player had in this game (null = unknown / not matched). */
  playerColor: Color | null;
  playerElo?: number;
  resultForPlayer: 'win' | 'loss' | 'draw' | null;
}

export interface MoveAnalysis {
  ply: number;
  moveNumber: number;
  color: Color;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  phase: GamePhase;
  classification: MoveClassification;
  /** Centipawn loss vs the engine's best move, from the mover's perspective (capped). */
  cpl: number;
  evalBeforeWhite: number;
  evalAfterWhite: number;
  bestMoveUci: string;
  bestMoveSan: string;
  pvSan: string[];
  capture: boolean;
  check: boolean;
  secondsSpent?: number;
  /** Position contained a material imbalance / hanging piece / check — a "tactical context". */
  tacticalContext: boolean;
  /** Pattern ids detected on this move. */
  patterns: string[];
  accuracy: number; // lichess-style per-move accuracy
}

export interface PlayerGameMetrics {
  moves: number;
  avgCpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  accuracy: number;
  openingAccuracy: number | null;
  middlegameAccuracy: number | null;
  endgameAccuracy: number | null;
  tacticalAccuracy: number | null;
  strategicAccuracy: number | null;
  timeTrouble: boolean;
}

export interface PatternInstance {
  patternId: PatternId;
  gameId: string;
  ply: number;
  moveNumber: number;
  color: Color;
  phase: GamePhase;
  san: string;
  fenBefore: string;
  fenAfter: string;
  evalLoss: number;
  bestMoveSan: string;
  bestMoveUci: string;
  /** Concrete, position-specific description of what happened. */
  detail: string;
  secondsSpent?: number;
}

export type PatternId =
  // tactical
  | 'allowed_mate'
  | 'missed_mate'
  | 'ignored_threat'
  | 'hanging_piece'
  | 'back_rank'
  | 'missed_fork'
  | 'missed_material_gain'
  // strategic
  | 'bad_exchange'
  | 'king_safety'
  | 'pawn_structure'
  | 'passive_move'
  // opening
  | 'opening_deviation'
  | 'slow_development'
  // endgame
  | 'endgame_conversion'
  // decision making
  | 'fast_blunder';

export interface DiagnosisEvidence {
  gameId: string;
  gameLabel: string;
  date?: string;
  ply: number;
  moveNumber: number;
  color: Color;
  san: string;
  fenBefore: string;
  fenAfter: string;
  bestMoveSan: string;
  evalLoss: number;
  detail: string;
}

export interface TrainingRecommendation {
  type: 'puzzles' | 'review' | 'principle' | 'play';
  title: string;
  description: string;
}

export type DiagnosisCategory =
  | 'tactical'
  | 'strategic'
  | 'opening'
  | 'middlegame'
  | 'endgame'
  | 'decision';

export interface ChessDiagnosis {
  id: string;
  category: DiagnosisCategory;
  title: string;
  severity: 'stable' | 'mild' | 'moderate' | 'significant' | 'critical';
  confidence: 'low' | 'medium' | 'high';
  frequency: number;
  affectedGames: number;
  affectedPositions: number;
  averageEvalLoss: number;
  trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
  evidence: DiagnosisEvidence[];
  recommendations: TrainingRecommendation[];
  /** What the player repeatedly does (from real positions). */
  typicalPattern: string;
  /** What to start noticing, anchored to the actual pattern. */
  whatToNotice: string;
}

export interface TrainingTask {
  text: string;
  done: boolean;
  /** Optional deep-link: open a specific position in the Game Explorer. */
  gameId?: string;
  ply?: number;
}

export interface TrainingDay {
  label: string;
  focus: string;
  tasks: TrainingTask[];
}

export interface TrainingPlan {
  diagnosisId: string;
  title: string;
  days: TrainingDay[];
}

export interface Puzzle {
  id: string;
  gameId: string;
  gameLabel: string;
  ply: number;
  fen: string;
  solutionUci: string;
  solutionSan: string;
  playedSan: string;
  evalLoss: number;
  theme: string;
  category: DiagnosisCategory;
  difficulty: 'easy' | 'intermediate' | 'advanced';
  detail: string;
  bestPvSan: string[];
}

export interface GameAnalysis {
  id: string;
  importedAt: number;
  analyzedAt: number;
  engine: { name: string; depth: number };
  info: GameInfo;
  startFen: string;
  moves: MoveAnalysis[];
  instances: PatternInstance[];
  criticalPlies: number[];
  metrics: { white: PlayerGameMetrics; black: PlayerGameMetrics };
}

export interface Filters {
  color: 'both' | 'white' | 'black';
  timeControl: 'all' | 'bullet' | 'blitz' | 'rapid' | 'classical' | 'unknown';
  opening: string; // 'all' or an ECO+opening label
  dateFrom?: string;
  dateTo?: string;
  severity: 'all' | 'critical' | 'significant' | 'moderate' | 'mild';
  phase: 'all' | GamePhase;
}

export interface OpeningRow {
  name: string;
  games: number;
  avgCpl: number;
  accuracy: number;
  scorePct: number; // win+half-loss percentage for the player
  avgLossPerGame: number;
}

export interface DashboardData {
  gamesAnalyzed: number;
  movesAnalyzed: number;
  diagnosticConfidence: number; // 0..100
  confidenceLabel: 'low' | 'medium' | 'high';
  gamesToTarget: number;
  overall: {
    avgCpl: number;
    blunderRate: number;
    mistakeRate: number;
    inaccuracyRate: number;
    accuracy: number;
    tacticalAccuracy: number;
    strategicAccuracy: number;
    openingAccuracy: number;
    endgameAccuracy: number;
  };
  ratingSeries: { gameId: string; label: string; elo: number }[];
  ratingTrend: number | null;
  perGameSeries: {
    gameId: string;
    label: string;
    cpl: number;
    blunderRate: number;
    accuracy: number;
  }[];
  conditionSummary: string;
  openings: OpeningRow[];
  diagnoses: ChessDiagnosis[];
  secondaryDiagnoses: ChessDiagnosis[];
  strengths: string[];
  beforeAfter: { metric: string; before: number; after: number; unit: string; sufficient: boolean }[];
}
