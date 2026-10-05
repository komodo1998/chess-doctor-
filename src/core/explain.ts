// AIExplanationService — the explanation & coaching layer.
//
// The engine is the source of chess truth; this layer only explains what the
// engine + pattern detector already established. It runs in deterministic
// "template" mode: every sentence is anchored to real positions and real
// evaluation drops, never generic. The `llm` seam below is where an actual
// LLM can be plugged in later without touching the rest of the app.

import type { DiagnosisCategory, PatternId } from './types';

export interface PatternMeta {
  title: string;
  category: DiagnosisCategory;
  /** "Typical Pattern" line for diagnosis cards. */
  typicalPattern: string;
  /** "What You Should Notice" line for diagnosis cards. */
  whatToNotice: string;
  /** The chess principle behind the pattern. */
  principle: string;
  /** Training idea used by the plan generator. */
  trainingIdea: string;
}

export const PATTERN_META: Record<PatternId, PatternMeta> = {
  allowed_mate: {
    title: 'Allowed Forced Mate',
    category: 'tactical',
    typicalPattern:
      'A move overlooks a mating net that was already hanging in the air — usually right after a heavy piece took aim at your king.',
    whatToNotice:
      'Before each move, ask one question first: "what is my opponent threatening?" A mate threat outranks every plan of your own.',
    principle: 'King safety outranks material. When an attack on your king exists, defense is the whole job.',
    trainingIdea: 'Defensive calculation: solve positions where the first move must parry a mate or decisive threat.',
  },
  missed_mate: {
    title: 'Missed Forced Mate',
    category: 'tactical',
    typicalPattern:
      'Winning attacking positions were converted into quiet moves — the mating combination existed but was never calculated to the end.',
    whatToNotice:
      'When your rooks/queen point at the enemy king, force yourself to calculate checks first — mates hide in forcing sequences.',
    principle: 'When you have an attack, calculation beats intuition. Check all checks, in order of forcing-ness.',
    trainingIdea: 'Mating patterns: practice classic mates (back rank, smothered, Greek gift) until they jump out.',
  },
  ignored_threat: {
    title: 'Missed Opponent Threats',
    category: 'decision',
    typicalPattern:
      'You continue your own plan while an immediate tactical threat is on the board — a piece was attacked and stayed attacked.',
    whatToNotice:
      'After every opponent move, name the threat out loud before choosing your move. If you cannot name it, look again.',
    principle: 'Every opponent move makes a threat — captures, attacks, or a bigger plan. Identify it before you commit.',
    trainingIdea: 'Threat identification: for each puzzle, state the opponent threat before looking for your move.',
  },
  hanging_piece: {
    title: 'Loose Pieces',
    category: 'tactical',
    typicalPattern:
      'Pieces are left on attacked squares — moving into capture ranges, or pulling a defender away from a piece that needed it.',
    whatToNotice:
      'Track which of your pieces are undefended ("LPDO — Loose Pieces Drop Off"). Before releasing a move, re-scan all your pieces.',
    principle: 'An undefended piece is a tactical liability. Every move changes which pieces are loose.',
    trainingIdea: 'Hanging-piece scans: 10 quick puzzles focused on noticing undefended pieces for both sides.',
  },
  back_rank: {
    title: 'Back-Rank Weakness',
    category: 'tactical',
    typicalPattern:
      'The king stays walled in on its original square while the back rank is never given an escape hatch — heavy-piece sacrifices then hit like a truck.',
    whatToNotice:
      'Count the escape squares around your king. A single luft move (h2/h3) at the right time removes 90% of back-rank tricks.',
    principle: 'A king with no luft is a tactical target even behind three pawns.',
    trainingIdea: 'Back-rank puzzles: sacrifices and defenses on the first/eighth rank.',
  },
  missed_fork: {
    title: 'Missed Forks & Double Attacks',
    category: 'tactical',
    typicalPattern:
      'Positions contained a move hitting two targets at once — often with a knight — but the double attack was not on the candidate list.',
    whatToNotice:
      'Look for moves that hit two enemy pieces at once, especially knight jumps. Also scan for what YOUR pieces attack after a quiet move.',
    principle: 'The fork is the most common winning tactic after the simple capture. Two targets = one good move.',
    trainingIdea: 'Knight/pawn fork drills: 15 puzzles where the solution is a double attack.',
  },
  missed_material_gain: {
    title: 'Missed Free Material',
    category: 'tactical',
    typicalPattern:
      'Capturable material stayed on the board — the capture was available but a quieter move was preferred.',
    whatToNotice:
      'Before every move, complete the scan: checks, captures, threats — in that order. Most free material is a capture away.',
    principle: ' CCT: Checks, Captures, Threats. Run it every move, for both sides.',
    trainingIdea: 'Capture-awareness drills: puzzles won by simply taking the right piece.',
  },
  bad_exchange: {
    title: 'Bad Exchanges',
    category: 'strategic',
    typicalPattern:
      'Captures were initiated that lose material after the recapture — the sequence was seen one move too short.',
    whatToNotice:
      'Before capturing, play the recapture in your head. Who is left standing on the square, and is that good for you?',
    principle: 'Count the whole exchange sequence to the end, not just the first capture.',
    trainingIdea: 'Static exchange evaluation practice: for each capture quiz, predict who wins the square.',
  },
  king_safety: {
    title: 'King Safety Under Pressure',
    category: 'middlegame',
    typicalPattern:
      'Moves invite enemy pieces toward your king — open lines and missing defenders let the attack grow piece by piece.',
    whatToNotice:
      'Count attackers vs defenders around your king after each move. If the number grows, fix it before continuing your plan.',
    principle: 'An attack succeeds when attackers outnumber defenders. Never let that ratio drift unnoticed.',
    trainingIdea: 'King-safety review: replay your own attacked positions and mark each attacker/defender.',
  },
  pawn_structure: {
    title: 'Pawn Structure Damage',
    category: 'strategic',
    typicalPattern:
      'Pawn moves create doubled or isolated pawns without gaining activity or compensation in return.',
    whatToNotice:
      'Before a pawn move, ask what squares it abandons and which files it opens. Pawns never move backwards.',
    principle: 'Every pawn push is a structural commitment. Doubled/isolated pawns need a concrete reason.',
    trainingIdea: 'Structure study: review your own doubled/isolated pawn positions and find the alternative plan.',
  },
  passive_move: {
    title: 'Passive Piece Play',
    category: 'strategic',
    typicalPattern:
      'In worse or balanced positions, pieces retreat to the first ranks instead of generating counterplay.',
    whatToNotice:
      'When you cannot find a good retreat, look for the most active square the piece can reach. Passivity compounds.',
    principle: 'A bad position is rarely saved by retreating. Counterplay is the currency of defense.',
    trainingIdea: 'Active-choice training: puzzles where the only good move is the most aggressive one.',
  },
  opening_deviation: {
    title: 'Early Opening Deviations',
    category: 'opening',
    typicalPattern:
      'Evaluation is already lost inside the first ten moves — the same lines are left too early or move-order tricks are missed.',
    whatToNotice:
      'Note exactly where your prepared lines end. If you cannot name your plan after the last theory move, that is where study starts.',
    principle: 'Opening principles only work while the position is still principled: center, development, king safety.',
    trainingIdea: 'Line repair: rebuild your opening repertoire from the exact deviation moves flagged below.',
  },
  slow_development: {
    title: 'Slow Opening Development',
    category: 'opening',
    typicalPattern:
      'Minor pieces stay on their starting squares while already-developed pieces (often the queen) move again.',
    whatToNotice:
      'In the opening, prefer the move that brings a NEW piece closer to the fight. Ask "which piece is my worst-placed piece?"',
    principle: 'Open with knights and bishops, castle early, connect the rooks — then start piece regrouping.',
    trainingIdea: 'Development drills: rapid games with the rule "no piece moves twice until all minors are out".',
  },
  endgame_conversion: {
    title: 'Endgame Conversion Technique',
    category: 'endgame',
    typicalPattern:
      'Winning endgame evaluations were slowly returned to equality — the advantage existed but never became a result.',
    whatToNotice:
      'In winning endgames, activate the king and push the most advanced passed pawn. Every trade should increase your winning chances.',
    principle: 'Up material or position? Simplify towards a known won ending and never relax until the point is scored.',
    trainingIdea: 'Technical endgames: rook endings and passed-pawn races from your own converted/failed positions.',
  },
  fast_blunder: {
    title: 'Playing Too Quickly',
    category: 'decision',
    typicalPattern:
      'Expensive moves were played within seconds — the biggest losses came from the fastest decisions.',
    whatToNotice:
      'When you "see" a move instantly, that is exactly when to pause: check the opponent\'s reply before playing it.',
    principle: 'Speed is only an asset when the position is forcing. Slow down for every capture and check.',
    trainingIdea: 'Blunder-check routine: build a fixed 3-step pre-move ritual and use it in your next rapid games.',
  },
};

export const CATEGORY_LABELS: Record<DiagnosisCategory, string> = {
  tactical: 'Tactical',
  strategic: 'Strategic',
  opening: 'Opening',
  middlegame: 'Middlegame',
  endgame: 'Endgame',
  decision: 'Decision Making',
};

/**
 * The LLM seam. Given structured facts, a real LLM could produce richer prose.
 * In template mode we return `null` and the UI falls back to the deterministic
 * explanation, so the product never depends on an external service.
 */
export interface LlmExplanationRequest {
  patternId: PatternId;
  detail: string;
  evalLoss: number;
  bestMoveSan: string;
  phase: string;
  fenBefore: string;
}

export type LlmExplanationFn = (req: LlmExplanationRequest) => Promise<string | null>;

let llmHook: LlmExplanationFn | null = null;

/** Optional integration point: register an LLM-backed explainer at runtime. */
export function registerLlmExplainer(fn: LlmExplanationFn | null): void {
  llmHook = fn;
}

export async function explainInstance(req: LlmExplanationRequest): Promise<string> {
  if (llmHook) {
    try {
      const text = await llmHook(req);
      if (text) return text;
    } catch {
      /* fall through to template mode */
    }
  }
  const meta = PATTERN_META[req.patternId];
  return `${req.detail} — ${meta.whatToNotice}`;
}
