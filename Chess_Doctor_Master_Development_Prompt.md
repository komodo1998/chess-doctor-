# Chess Doctor — Master Development Prompt

Build a complete production-ready feature called **Chess Doctor** for my chess application **SynChess**.

## Product Concept

Chess Doctor is an AI-powered chess diagnostic system that analyzes a player's games and identifies the player's recurring weaknesses, strengths, habits, and training needs.

The goal is **not simply to show engine evaluations**. The system must answer:

- What does this player consistently do wrong?
- Why does the mistake happen?
- In what types of positions does it happen?
- Is it a tactical, strategic, positional, opening, endgame, calculation, time-management, or decision-making problem?
- Is the problem occasional or recurring?
- What should the player train to improve it?

The feature should feel like a **chess medical diagnosis**.

---

# 1. Chess Doctor Dashboard

Create a dedicated **Chess Doctor** section in SynChess.

Top header:

**Chess Doctor**  
*Diagnose your chess. Understand your weaknesses. Train what actually matters.*

Display:

- Games analyzed
- Games remaining
- Diagnostic confidence
- Overall diagnostic summary
- Current rating
- Rating trend
- Average centipawn loss
- Blunder rate
- Mistake rate
- Inaccuracy rate
- Tactical accuracy
- Strategic accuracy
- Opening accuracy
- Endgame accuracy

Do not use a single simplistic "skill score" as the primary output. The system should expose the underlying measurements.

---

# 2. Diagnostic Categories

Analyze the player's games across these categories:

### Tactical

- Missed tactics
- Hanging pieces
- Missed forks
- Pins
- Skewers
- Discovered attacks
- Deflections
- Removal of defender
- Zwischenzug
- Back-rank problems
- Mating patterns
- Calculation failures

### Strategic

- Weak pawn structures
- Bad exchanges
- Poor piece placement
- Passive pieces
- Weak squares
- Wrong plans
- Premature attacks
- Lack of counterplay
- Poor space management
- Poor transitions

### Opening

- Repeated opening inaccuracies
- Early development problems
- Repeated opening traps
- Poor move-order decisions
- Failure to follow opening principles
- Positions where the player leaves known theory too early

### Middlegame

- Tactical awareness
- Candidate-move selection
- Planning
- Piece coordination
- Initiative
- King safety
- Attack conversion
- Defensive technique

### Endgame

- King activity
- Pawn endings
- Rook endings
- Minor-piece endings
- Conversion technique
- Drawing technique
- Passed-pawn handling
- Opposition
- Calculation in simplified positions

### Decision Making

Detect recurring patterns such as:

- Playing too quickly
- Choosing natural-looking but inferior moves
- Ignoring opponent threats
- Failing to compare candidate moves
- Repeatedly choosing passive moves
- Taking unnecessary risks
- Avoiding necessary complications

Do not claim psychological or medical diagnoses. This is a chess-performance diagnostic system only.

---

# 3. Engine Analysis Pipeline

Use **Stockfish** as the objective chess engine.

For every critical position:

1. Analyze the original position.
2. Analyze the player's move.
3. Calculate evaluation before the move.
4. Calculate evaluation after the move.
5. Identify the best engine move.
6. Store principal variation.
7. Calculate evaluation loss.
8. Determine whether the move is:
   - Best
   - Excellent
   - Good
   - Inaccuracy
   - Mistake
   - Blunder

The thresholds should be configurable rather than hard-coded throughout the UI.

Store analysis in structured JSON.

Example:

```json
{
  "fen": "...",
  "playedMove": "Qh5",
  "bestMove": "Nc3",
  "evaluationBefore": 0.42,
  "evaluationAfter": -1.85,
  "centipawnLoss": 227,
  "classification": "blunder",
  "pv": ["Nc3", "Nf6", "Bg5", "Be7"],
  "phase": "middlegame"
}
```

---

# 4. Critical Position Detection

Do not analyze every move with the same depth.

Identify **critical moments** using:

- Large evaluation swings
- Tactical opportunities
- Missed winning chances
- Missed defensive resources
- Forced moves
- Major exchanges
- Position transitions
- Opening deviations
- Endgame transitions

Prioritize positions with meaningful instructional value.

---

# 5. FEN-Aware Diagnosis

Every diagnosis must be based on the actual position.

The system must understand:

- Material
- King safety
- Pawn structure
- Piece activity
- Tactical threats
- Open files
- Weak squares
- Passed pawns
- Space
- Initiative
- Candidate moves
- Strategic plans

Never generate generic commentary such as:

> "You should improve your piece development."

unless the actual position and game data support that conclusion.

---

# 6. Recurring Weakness Detection

This is the core of Chess Doctor.

Do not diagnose a weakness from a single game.

Aggregate evidence across multiple games.

For each identified weakness calculate:

- Frequency
- Number of games affected
- Number of positions affected
- Average evaluation loss
- Severity
- Recurrence
- Recent trend
- Confidence

Example:

```text
Diagnosis: Tactical Awareness

Observed in:
14 of 22 games

Critical positions:
31

Average evaluation loss:
0.91

Most common pattern:
Missed opponent threats

Trend:
Improving

Confidence:
High
```

---

# 7. Diagnosis Cards

Create visually strong diagnostic cards.

Each card should contain:

**Diagnosis**  
> Missed Opponent Threats

**Evidence**  
> Detected in 14 of 22 analyzed games.

**Typical Pattern**  
> You frequently continue your own plan without responding to an immediate tactical threat.

**Impact**  
> 1.8 average evaluation loss in affected positions.

**Example**  
Show the actual chess position.

**What You Should Notice**  
Explain the tactical or strategic idea.

**Recommended Training**  
Generate targeted exercises.

---

# 8. Severity Levels

Use:

- Stable
- Mild
- Moderate
- Significant
- Critical

These labels must be based on documented quantitative thresholds from the analysis system.

Do not fabricate diagnostic certainty.

Use confidence levels:

- Low confidence
- Medium confidence
- High confidence

A weakness should require enough supporting examples before being considered a recurring diagnosis.

---

# 9. AI Explanation Layer

Use an LLM only as the **explanation and coaching layer**.

The engine remains the source of chess truth.

Pipeline:

**PGN → Stockfish → structured analysis → pattern detection → diagnosis → LLM explanation**

The LLM must never override Stockfish's best move or evaluation.

The LLM should explain:

- What happened
- Why the move failed
- What the player should have noticed
- What chess principle applies
- How the pattern appeared in other games
- How to train it

Use language suitable for the player's level.

---

# 10. Doctor Report

Generate a complete report called:

**Your Chess Diagnosis**

Structure:

### Overall Condition

A concise summary of the player's current playing tendencies.

### Primary Weaknesses

Show the most recurring problems supported by the games.

### Secondary Weaknesses

Less frequent but meaningful issues.

### Strengths

Identify areas where the player performs consistently well.

### Recurring Patterns

Show repeated behavior across games.

### Opening Profile

Show openings where performance differs.

### Middlegame Profile

Show recurring middlegame issues.

### Endgame Profile

Show recurring endgame issues.

### Tactical Profile

Show tactical strengths and weaknesses.

### Improvement Plan

Create a prioritized training program.

---

# 11. Personalized Training Plan

For every major diagnosis generate training tasks.

Example:

```text
Diagnosis:
Missed defensive tactics

Training plan:

Day 1:
10 defensive puzzles

Day 2:
Threat-identification exercises

Day 3:
Analyze 3 historical positions

Day 4:
Play a tactical training session

Day 5:
Re-test the original weakness
```

Training should be generated from the player's actual mistakes whenever possible.

---

# 12. Mistake → Puzzle System

Every meaningful mistake can become a personalized puzzle.

Store:

- Original FEN
- Player's move
- Best move
- Evaluation swing
- Tactical/strategic theme
- Correct solution
- Explanation
- Difficulty
- Diagnosis category

Example:

```text
Why did you play Qh5?

Find the best move.

[Chess Board]

Theme:
Opponent Threat

Difficulty:
Intermediate
```

After the player solves it, explain the difference between:

**What you played**  
and  
**What the position required**

---

# 13. Progress Tracking

Chess Doctor must monitor whether diagnosed weaknesses improve over time.

Create historical charts for:

- Blunder rate
- CPL
- Tactical accuracy
- Mistake frequency
- Opening performance
- Endgame performance
- Diagnosis severity
- Puzzle success rate

Show:

**Before Training → After Training**

Do not claim improvement unless supported by sufficient game data.

---

# 14. Game Explorer

Allow the user to click a diagnosis and immediately see the games that caused it.

Example:

**Missed Tactical Threats**

[Game 4]  
Move 18

[Game 7]  
Move 27

[Game 12]  
Move 21

Clicking a result should open the exact position in the SynChess analysis board.

---

# 15. UX Design

The interface should look like a premium chess analysis laboratory.

Design language:

- Dark chess interface
- Minimal clutter
- Strong hierarchy
- Modern cards
- Subtle animations
- Clear typography
- Chessboard-centric layouts
- Professional analytical appearance

Avoid making it look like a medical/hospital application.

Use the concept of a "diagnostic report" without using medical imagery.

---

# 16. Technical Architecture

Design Chess Doctor as modular services/components.

Suggested architecture:

```text
ChessDoctor
├── GameImporter
├── PGNParser
├── EngineAnalyzer
├── CriticalPositionDetector
├── PatternDetector
├── DiagnosisEngine
├── EvidenceAggregator
├── TrainingGenerator
├── PuzzleGenerator
├── AIExplanationService
├── ProgressTracker
└── ChessDoctorUI
```

Use reusable TypeScript interfaces.

Example:

```ts
interface ChessDiagnosis {
  id: string;
  category:
    | "tactical"
    | "strategic"
    | "opening"
    | "middlegame"
    | "endgame"
    | "decision";
  title: string;
  severity: "stable" | "mild" | "moderate" | "significant" | "critical";
  confidence: "low" | "medium" | "high";
  frequency: number;
  affectedGames: number;
  affectedPositions: number;
  averageEvalLoss: number;
  evidence: DiagnosisEvidence[];
  recommendations: TrainingRecommendation[];
}
```

---

# 17. Data Quality Rules

Implement safeguards:

- Never diagnose from one isolated move.
- Distinguish lack of evidence from absence of weakness.
- Separate opening knowledge from calculation mistakes.
- Separate tactical blunders from strategic inaccuracies.
- Account for time-control differences.
- Account for player color.
- Account for game phase.
- Avoid double-counting the same mistake.
- Do not treat engine disagreement at shallow depth as definitive.
- Record engine depth/time for every analysis.

---

# 18. Filters

Allow filtering by:

- Date range
- Color
- Time control
- Rating range
- Opening
- Opponent
- Game phase
- Diagnosis
- Severity

---

# 19. Minimum Viable Version

First implement this workflow:

```text
Import PGN
↓
Analyze games with Stockfish
↓
Detect critical mistakes
↓
Classify mistakes
↓
Aggregate recurring patterns
↓
Generate 3–5 Chess Doctor diagnoses
↓
Show supporting positions
↓
Generate personalized training recommendations
```

Build the MVP first before adding advanced visualizations.

---

# 20. Important Product Principle

Chess Doctor must answer:

**"What is wrong with my chess?"**

but the answer must always be backed by:

**specific games + specific positions + engine evidence + recurring statistical patterns.**

Avoid generic AI coaching.

The product's value comes from turning a player's historical games into an individualized diagnostic model.

---

# 21. Deliverables

Implement:

1. Chess Doctor dashboard
2. Game-analysis pipeline
3. Pattern detection engine
4. Diagnosis engine
5. Evidence aggregation
6. Diagnosis cards
7. Doctor report
8. Personalized training recommendations
9. Mistake-to-puzzle generation
10. Progress tracking
11. Game explorer
12. Responsive desktop/mobile UI

Integrate it cleanly into the existing SynChess architecture without breaking current features.

Before writing large amounts of code, inspect the existing repository architecture and reuse existing Stockfish, PGN, board, analysis, UI, database, and AI infrastructure wherever available.

Do not duplicate existing systems unnecessarily.

Implement the feature in production-quality TypeScript with clear module boundaries, error handling, loading states, empty states, and testable core logic.
