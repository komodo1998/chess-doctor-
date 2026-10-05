import { readFileSync } from 'node:fs';
// Bug-verification harness for the core pipeline (mocked engine, no WASM needed).
import { Chess } from 'chess.js';
import { AnalysisPipeline, computeCpl, classifyMove } from '../src/core/analysis';
import { DEFAULT_CONFIG } from '../src/core/config';
import { moveAccuracy } from '../src/core/accuracy';
import { MATE_CAP } from '../src/core/engine';
import { parsePgn, suggestPlayerName } from '../src/core/pgn';
import { buildPuzzles } from '../src/core/puzzles';
import type { EngineEval, GameInfo } from '../src/core/types';

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  ✔ ${name}`);
  else {
    failures++;
    console.error(`  ✘ ${name} ${detail}`);
  }
};

console.log('— computeCpl: mate logic from the mover’s point of view —');
const cplBlackDefends = computeCpl(MATE_CAP - 1, 300, false, 1, null);
check('Black correctly defending vs forced mate → no 900 penalty', cplBlackDefends !== 900, `got ${cplBlackDefends}`);
check('Black defensive move is low cpl', cplBlackDefends <= 60, `got ${cplBlackDefends}`);
check('classification not blunder', classifyMove(cplBlackDefends, DEFAULT_CONFIG) !== 'blunder');

const cplWhiteErrs = computeCpl(MATE_CAP - 1, 300, true, 1, null);
check('White missing own mate → catastrophic 900', cplWhiteErrs === 900, `got ${cplWhiteErrs}`);

const cplStillMated = computeCpl(-(MATE_CAP - 2), -(MATE_CAP - 1), true, -2, -1);
check('still getting mated → 0', cplStillMated === 0, `got ${cplStillMated}`);

const cplEscaped = computeCpl(MATE_CAP - 3, 150, false, 3, null);
check('Black escapes a mate → 0', cplEscaped === 0, `got ${cplEscaped}`);

// Black to move, White threatens mate: evalAfterWhite = +(MATE_CAP-2) means
// WHITE mates (positive = good for White), mateIn +2 = White mates in 2.
const cplAllowsMate = computeCpl(120, MATE_CAP - 2, false, null, 2);
check('Black move allowing White mate → capped catastrophic', cplAllowsMate >= 900, `got ${cplAllowsMate}`);

console.log('— pipeline: game ending in checkmate (Fool’s mate) —');
const pgn = [
  '[Event "T"]', '[White "Alex"]', '[Black "Bea"]', '[Result "0-1"]', '',
  '1. f3 e5 2. g4 Qh4# 0-1', '',
].join('\n');
const { games } = parsePgn(pgn);
check('PGN parses to 1 game', games.length === 1);

// Mock engine: returns neutral evals; terminal positions get cp 0 (what the
// real worker does when it has no info) — the pipeline must patch them.
const mockEngine = {
  newGame() {},
  cancel() {},
  async analyze(fen) {
    const turnWhite = (fen.split(' ')[1] ?? 'w') === 'w';
    return {
      fen, depth: 8, bestMoveUci: 'e2e4', cpWhite: turnWhite ? 30 : -30, mateIn: null,
      pvUci: ['e2e4'], lines: [],
    } as EngineEval;
  },
};

const info: GameInfo = {
  white: 'Alex', black: 'Bea', result: '0-1', timeControlKind: 'unknown',
  playerColor: 'white', playerElo: 1500, resultForPlayer: 'loss',
};
const pipeline = new AnalysisPipeline(mockEngine as never, DEFAULT_CONFIG);
const analyzed = await pipeline.analyzeGame(
  { startFen: new Chess().fen(), plies: games[0].plies }, info, 'g1',
  () => {}, 0, 1, 'Alex – Bea'
);

const mateMove = analyzed.moves[3]; // Qh4# — played by Black, so the mate score is negative from White's POV
check('move 4 black is Qh4#', mateMove.san === 'Qh4#', `got ${mateMove.san}`);
check('mating move evalAfter is a Black-mate score', mateMove.evalAfterWhite <= -(MATE_CAP - 1), `got ${mateMove.evalAfterWhite}`);
check('mating move classified best', mateMove.classification === 'best', `got ${mateMove.classification}`);
check('mating move accuracy ~100', mateMove.accuracy > 99, `got ${mateMove.accuracy}`);
check('mating move cpl 0', mateMove.cpl === 0, `got ${mateMove.cpl}`);
const finalPositionMate = new Chess(analyzed.moves[3].fenAfter).isCheckmate();
check('final fen is checkmate', finalPositionMate);

console.log('— puzzle generation from a real mistake —');
const trapPgn = [
  '[Event "T2"]', '[White "Alex"]', '[Black "Bea"]', '[Result "1-0"]', '',
  '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0', '',
].join('\n');
const parsed2 = parsePgn(trapPgn).games[0];
const analyzed2 = await pipeline.analyzeGame(
  { startFen: new Chess().fen(), plies: parsed2.plies },
  { ...info, playerColor: 'black', resultForPlayer: 'loss' },
  'g2', () => {}, 0, 1, 'Alex – Bea'
);
// Give black's 3...Nf6?? a big eval loss so it becomes a puzzle.
analyzed2.moves[5].cpl = 850;
analyzed2.moves[5].evalBeforeWhite = -50;
analyzed2.moves[5].evalAfterWhite = 900;
analyzed2.instances = [{
  patternId: 'allowed_mate', gameId: 'g2', ply: 6, moveNumber: 3, color: 'black',
  phase: 'opening', san: 'Nf6', fenBefore: analyzed2.moves[5].fenBefore, fenAfter: analyzed2.moves[5].fenAfter,
  evalLoss: 850, bestMoveSan: 'g6', bestMoveUci: 'g7g6', detail: 'test',
}];
const puzzles = buildPuzzles([analyzed2], DEFAULT_CONFIG, 'Alex');
check('blunder became a puzzle', puzzles.length === 1, `got ${puzzles.length}`);
if (puzzles.length === 1) {
  check('puzzle solution is the engine best', puzzles[0].solutionUci === 'g7g6');
  check('puzzle targets the player color', puzzles[0].fen.split(' ')[1] === 'b');
}

console.log('— PGN helpers —');
const samples = parsePgn(readFileSync(new URL('../public/samples/demo-games.pgn', import.meta.url), 'utf8'));
check('sample file parses with 0 errors', samples.games.length === 9 && samples.errors.length === 0, `games=${samples.games.length} errors=${JSON.stringify(samples.errors)}`);
check('player auto-detected as Alex', suggestPlayerName(samples.games) === 'Alex');

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
