# ♞ Chess Doctor

**Diagnose your chess. Understand your weaknesses. Train what actually matters.**

Chess Doctor is an AI-powered chess diagnostic desktop web app. It ingests your PGN games, runs every position through **Stockfish 19 NNUE** (the official universal WASM build), grades every move, detects *recurring* mistake patterns across many games, and produces a medical-style diagnosis — backed by specific games, specific positions, and engine evidence. No generic coaching.

Built on open-source components from the **Lichess** ecosystem:

| Component | Source | Role |
|---|---|---|
| Board UI | [`lichess-org/chessground`](https://github.com/lichess-org/chessground) (MIT) | The exact board Lichess.org uses, with embedded cburnett pieces |
| Engine | [`stockfish` npm v19](https://www.npmjs.com/package/stockfish) — official Stockfish 19 WASM build | Position evaluation in a Web Worker (UCI), SFNNv16 NNUE net embedded in the wasm |
| Accuracy model | Lichess (lila) win-probability → accuracy formula | Per-move and per-game accuracy numbers |
| Move logic | [`chess.js`](https://github.com/jhlywa/chess.js) | PGN parsing, legality, SAN/UCI conversion |

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview    # serves the dist/ build
```

> The engine runs as a Web Worker — the app must be served over http(s) (dev server or preview), never opened as a `file://` page.
>
> **Stockfish 19, max power.** Both `npm run dev` and `npm run preview` send cross-origin-isolation headers (COOP/COEP, see `vite.config.ts`), which unlocks the **multi-threaded** build: the engine uses every CPU core but one (up to 12 threads) and a 256 MB hash. The SF19 NNUE net (SFNNv16) is embedded in the wasm — nothing to download. Served without those headers (e.g. a plain static file server), the app automatically falls back to the single-threaded build of the same engine.

First run: click **Load sample games** → **Import & Analyze**. Nine demo games (including famous miniatures and clocked blitz traps) are analyzed in ~1–2 minutes at depth 14. Import your own games by pasting PGN (lichess exports work, including `%clk` time comments) or choosing a `.pgn` file.

## What it does

```
Import PGN → Stockfish analysis → move classification → critical position detection
→ pattern detection → evidence aggregation → diagnoses → training + puzzles
```

- **Dashboard** — games analyzed, diagnostic confidence, avg centipawn loss, blunder/mistake/inaccuracy rates, tactical/strategic/opening/endgame accuracy, rating trend, per-game charts, opening profile, overall condition summary.
- **Diagnoses** — cards for recurring weaknesses (e.g. *Allowed Forced Mate*, *Loose Pieces*, *Missed Opponent Threats*). Each card shows games affected, flagged positions, average eval loss, trend, severity + confidence, the **actual positions** as evidence (click any to open the Game Explorer), and targeted training recommendations.
- **Doctor Report** — printable "Your Chess Diagnosis": overall condition, primary/secondary weaknesses, strengths, recurring-pattern table, opening/middlegame/endgame/tactical profiles, prioritized improvement plan.
- **Puzzles** — every significant mistake (≥ configurable eval loss) becomes a puzzle from your own games: find the engine's best move, then see *what you played* vs *what the position required*.
- **Game Explorer** — all analyzed games move-by-move with classification badges, evaluations, clocks, critical-moment jumps, and engine PV lines.
- **Training** — a 5-day program per major diagnosis, built from the player's own flagged positions, with persisted checkboxes.

## Data quality rules (enforced in code)

- A diagnosis requires **≥ 3 occurrences across ≥ 2 games** (`src/core/config.ts`) — never a single-move verdict.
- Pattern instances are matched to the **player's color** (player name auto-detected from PGN headers; configurable).
- Moves that allow mate but were **forced** (engine's own best, or mate already unavoidable) are never flagged.
- Lack of evidence ≠ absence of weakness: confidence levels (low/medium/high) scale with sample size; trends need ≥ 6 games.
- Engine depth/time and every threshold are recorded & configurable; Stockfish remains the single source of chess truth — the explanation layer only annotates it (with a seam for a real LLM in `src/core/explain.ts`).

## Architecture

```
src/
├── core/                     # framework-free, testable engine pipeline
│   ├── types.ts              # ChessDiagnosis, MoveAnalysis, PatternInstance, Puzzle…
│   ├── config.ts             # ALL thresholds (classification, severity, confidence)
│   ├── pgn.ts                # GameImporter / PGNParser (multi-game, %clk, auto-detect)
│   ├── boardFacts.ts         # FEN-aware facts: attacks, hanging pieces, structure, phase
│   ├── engine.ts             # Stockfish WASM wrapper (UCI over Web Worker)
│   ├── analysis.ts           # pipeline + move classifier + per-game metrics
│   ├── critical.ts           # CriticalPositionDetector
│   ├── patterns.ts           # PatternDetector (15 concrete mistake patterns)
│   ├── aggregate.ts          # DiagnosisEngine + EvidenceAggregator + dashboard data
│   ├── accuracy.ts           # Lichess win% → accuracy model
│   ├── training.ts           # TrainingGenerator (5-day plans)
│   ├── puzzles.ts            # PuzzleGenerator
│   ├── explain.ts            # AIExplanationService (template mode + LLM seam)
│   └── storage.ts            # localStorage persistence, export/import, re-derivation
└── ui/                       # React views (dark analysis-lab design)
    ├── Board.tsx             # chessground wrapper (coords, dests, shapes)
    ├── DashboardView / DiagnosesView / ReportView / PuzzlesView / GamesView / TrainingView
    └── bits.tsx / charts.tsx # badges, stats, dependency-free SVG charts
```

All analysis data is structured JSON (`GameAnalysis` per game, stored in `localStorage`; export/import as JSON in Settings). Nothing leaves the machine — no network calls after load.

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run preview` — serve the production build
- `npm run typecheck` — TypeScript check only
- `npm test` — core-pipeline regression tests (classification, mate handling, terminal positions, puzzles, PGN parsing — no engine needed)
- `node scripts/verify-samples.mjs` — verify all sample PGNs are legal

## License notes

Chessground is MIT licensed; the Stockfish WASM build ships under GPL (see `node_modules/stockfish/Copying.txt`); cburnett piece artwork is embedded in chessground's CSS. Chess Doctor is a chess-performance diagnostic tool — it makes no psychological or medical claims.
