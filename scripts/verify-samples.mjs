// Verify all sample PGNs are legal and parseable — run: node scripts/verify-samples.mjs
import { Chess } from 'chess.js';
import { readFileSync } from 'node:fs';

const text = readFileSync(new URL('../public/samples/demo-games.pgn', import.meta.url), 'utf8');
const chunks = text.split(/\n\s*\n(?=\[)/).filter((c) => c.trim());
let failed = false;

for (const [i, chunk] of chunks.entries()) {
  const label = /\[Event\s+"([^"]*)"/.exec(chunk)?.[1] ?? `Game ${i + 1}`;
  try {
    const c = new Chess();
    c.loadPgn(chunk);
    const h = typeof c.getHeaders === 'function' ? c.getHeaders() : c.header();
    console.log(`✔ ${label} — ${c.history().length} plies, result ${h.Result}`);
  } catch (e) {
    failed = true;
    console.error(`✘ ${label}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
