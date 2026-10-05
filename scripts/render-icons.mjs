/* Renders the SVG icon set into PNGs for favicon / apple-touch / PWA use.
   Run: node scripts/render-icons.mjs  (regenerate after editing public/*.svg) */
import sharp from "sharp";
import { readFileSync } from "node:fs";

const bust = readFileSync("public/favicon.svg", "utf8")
  .replace(/<svg[^>]*>/, "")
  .replace("</svg>", "");

// Badge = dark app background (#12151b) with the mascot bust centered.
// rx=0 for apple-touch (iOS applies its own mask), rounded for PWA icons.
const badge = (rx) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" rx="${rx}" fill="#12151b"/>` +
  `<g transform="translate(61 61) scale(6.1)">${bust}</g></svg>`;

const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: (72 * size) / 512 })
    .resize(size, size)
    .png()
    .toFile(file);

await png(readFileSync("public/favicon.svg", "utf8"), 32, "public/favicon-32.png");
await png(badge(0), 180, "public/apple-touch-icon.png");
await png(badge(110), 512, "public/icon-512.png");
await png(badge(110), 192, "public/icon-192.png");

console.log("icons rendered: favicon-32.png, apple-touch-icon.png, icon-512.png, icon-192.png");
