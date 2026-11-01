// Round 3 of logo concepts. Run: node logo/make3.mjs  ->  logo/round3.html + logo/svg/r3-*.svg
import { writeFileSync } from 'node:fs';

const concepts = [
  {
    id: 'r3-upright',
    name: 'Upright key',
    idea: 'A key standing straight up, with a ring on top and teeth down one side. Reads as a numeral 1 and as a key.',
    site: 'Tomato red with near-black ink. Bold, poster-like, one big key per screen.',
    c: { bg: '#ff5a36', fg: '#1a0f0b', accent: '#ffffff' },
    mark: (c) => `<path fill="${c.fg}" fill-rule="evenodd" d="M21 17a11 11 0 1 1 22 0a11 11 0 1 1-22 0Z M27.5 17a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z"/><rect x="29" y="26" width="6" height="33" fill="${c.fg}"/><rect x="35" y="43" width="9" height="5" fill="${c.fg}"/><rect x="35" y="52" width="6" height="5" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'r3-slices',
    name: 'Slices',
    idea: 'A circle cut into slabs that have slid out of line, with one slab picked out. A pool of separate pieces that still make one whole.',
    site: 'Black with white and one turquoise slab. Sliding, sharp-edged motion.',
    c: { bg: '#101010', fg: '#f5f5f5', accent: '#3ddbd9' },
    mark: (c) => {
      const cy = 32, r = 27, n = 5, gap = 2.4, h = (2 * r - gap * (n - 1)) / n;
      const shift = [-3, 4, 0, -4, 3];
      return Array.from({ length: n }, (_, i) => {
        const y1 = cy - r + i * (h + gap), y2 = y1 + h, ym = (y1 + y2) / 2;
        const hw = Math.sqrt(Math.max(0, r * r - (ym - cy) ** 2));
        return `<rect x="${(32 - hw + shift[i]).toFixed(2)}" y="${y1.toFixed(2)}" width="${(2 * hw).toFixed(2)}" height="${h.toFixed(2)}" fill="${i === 2 ? c.accent : c.fg}"/>`;
      }).join('');
    },
    word: 'keypool',
  },
  {
    id: 'r3-cube',
    name: 'Cube',
    idea: 'A solid cube with a keyhole in one face. A sealed box with one way in.',
    site: 'Mint-grey with deep green. Tidy isometric diagrams, soft blocky shadows.',
    c: { bg: '#d8e8e0', fg: '#1d3b34', accent: '#ffb347' },
    mark: (c) => `<path fill="${c.fg}" opacity=".55" d="M32 5L55 18L32 31L9 18Z"/><path fill="${c.fg}" d="M9 18L32 31V59L9 46Z"/><path fill="${c.fg}" opacity=".8" d="M55 18L32 31V59L55 46Z"/><g transform="skewY(29.5)"><circle cx="20.5" cy="25" r="3.6" fill="${c.accent}"/><path fill="${c.accent}" d="M18.9 26.5H22.1L23 34H18Z"/></g>`,
    word: 'keypool',
  },
  {
    id: 'r3-kp',
    name: 'kp',
    idea: 'The letters k and p built from plain strokes into one compact monogram that fits any square.',
    site: 'Indigo with sunny yellow. Chunky letterforms, big type, playful but tidy.',
    c: { bg: '#2b3a67', fg: '#ffe066', accent: '#ffffff' },
    mark: (c) => `<g fill="${c.fg}"><rect x="7" y="7" width="9" height="50"/><path d="M16 38L35 20H46L25 42Z"/><path d="M22 36L28 31L47 57H36Z"/></g><g fill="none" stroke="${c.fg}" stroke-width="8.5"><circle cx="49.5" cy="36" r="9" /></g><rect x="36" y="31" width="8.5" height="30" fill="${c.fg}" opacity="0"/><circle cx="49.5" cy="36" r="2.4" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'r3-cyclops',
    name: 'One-eyed key',
    idea: 'A friendly key character with a single eye. One eye, one secret. It gives the brand a face and a mascot.',
    site: 'Bubble-gum pink and plum. Playful, rounded, with the mascot reacting to what you do.',
    c: { bg: '#ffc2d6', fg: '#2a1030', accent: '#ffffff' },
    mark: (c) => `<circle cx="32" cy="22" r="17" fill="${c.fg}"/><circle cx="32" cy="21" r="8" fill="${c.accent}"/><circle cx="33.5" cy="21.5" r="3.6" fill="${c.fg}"/><path d="M26 31q6 4.5 12 0" fill="none" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round"/><rect x="28.5" y="38" width="7" height="21" fill="${c.fg}"/><rect x="35.5" y="46" width="8" height="5" fill="${c.fg}"/><rect x="35.5" y="54" width="6" height="5" fill="${c.fg}"/>`,
    word: 'keypool',
  },
  {
    id: 'r3-orbit',
    name: 'Orbit',
    idea: 'A single ring with one bright bead riding it. One thing in motion, in a closed loop.',
    site: 'Midnight indigo with white and warm gold. Smooth orbiting motion, a calm sense of space.',
    c: { bg: '#1a1148', fg: '#ffffff', accent: '#ffb703' },
    mark: (c) => `<circle cx="32" cy="32" r="22" fill="none" stroke="${c.fg}" stroke-width="5"/><circle cx="47.6" cy="16.4" r="8" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'r3-door',
    name: 'Doorway',
    idea: 'An arched doorway with a single dot, like a keyhole at the end of a corridor. One way in, and you hold it.',
    site: 'Rust red with warm white. Arched shapes, architectural layout, big quiet spaces.',
    c: { bg: '#8c2f1b', fg: '#f7ede2', accent: '#ffc857' },
    mark: (c) => `<path fill="none" stroke="${c.fg}" stroke-width="6" stroke-linejoin="miter" d="M14 58V27a18 18 0 0 1 36 0V58Z"/><circle cx="32" cy="34" r="4.4" fill="${c.accent}"/><path d="M30 38H34L35 48H29Z" fill="${c.accent}"/>`,
    word: 'keypool',
  },
];

const svgOf = (k, size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${k.name} logo">${k.mark(k.c)}</svg>`;
for (const k of concepts) writeFileSync(`logo/svg/${k.id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${k.mark(k.c)}</svg>\n`);

const card = (k, i) => `
<article class="card" style="--bg:${k.c.bg};--fg:${k.c.fg};--ac:${k.c.accent}">
  <h2><span>${String.fromCharCode(79 + i)}</span> ${k.name}</h2>
  <div class="stage">
    <div class="big">${svgOf(k, 170)}</div>
    <div class="lock">${svgOf(k, 46)}<span class="word">${k.word}</span></div>
    <div class="small"><span>${svgOf(k, 32)}</span><span>${svgOf(k, 20)}</span><span>${svgOf(k, 16)}</span><em>app icon / tab / favicon</em></div>
  </div>
  <p class="idea">${k.idea}</p>
  <p class="site"><b>Site built around it:</b> ${k.site}</p>
</article>`;

writeFileSync('logo/round3.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Keypool logo concepts, round 3</title>
<style>
@font-face { font-family: "Public Sans"; src: url("fonts/public-sans.woff2") format("woff2"); font-weight: 100 900; }
*{box-sizing:border-box} body{margin:0;background:#eceff2;color:#0b1f33;font:400 16px/1.45 "Public Sans",system-ui,sans-serif;padding:28px clamp(14px,4vw,48px) 60px}
header h1{font-size:clamp(1.8rem,4vw,2.8rem);letter-spacing:-.03em;margin:0 0 6px;font-weight:900}
header p{margin:0 0 26px;color:#3f5469;max-width:46em}
a{color:inherit}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:22px}
.card{background:#fff;border:2px solid #0b1f33;display:grid;grid-template-rows:auto auto 1fr auto}
.card h2{margin:0;padding:12px 16px;font-size:1.05rem;border-bottom:2px solid #0b1f33}
.card h2 span{display:inline-grid;place-items:center;width:26px;height:26px;background:#0b1f33;color:#fff;margin-right:8px;font-size:.9rem}
.stage{background:var(--bg);color:var(--fg);display:grid;gap:18px;padding:22px 18px;justify-items:center}
.big svg{display:block}
.lock{display:flex;align-items:center;gap:12px}.word{font-size:2rem;font-weight:800;letter-spacing:-.04em}
.small{display:flex;align-items:center;gap:14px}.small em{font-style:normal;font-size:.75rem;opacity:.7}
.idea,.site{margin:0;padding:12px 16px 0;font-size:.95rem}.site{padding-bottom:16px;color:#3f5469}.site b{color:#0b1f33}
</style></head><body>
<header><h1>Keypool: logo concepts, round 3</h1><p>Seven more ideas, O to U. Earlier rounds: <a href="index.html">A to F</a> and <a href="round2.html">G to N</a>. Pick one and the whole site is built from it.</p></header>
<main class="grid">${concepts.map(card).join('')}</main>
</body></html>
`);
console.log('wrote', concepts.length, 'concepts');
