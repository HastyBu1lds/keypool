// Round 2 of logo concepts. Run: node logo/make2.mjs  ->  logo/round2.html + logo/svg/r2-*.svg
import { writeFileSync } from 'node:fs';

const rot = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

const concepts = [
  {
    id: 'r2-lone-key',
    name: 'Lone key',
    idea: 'One plain, well-drawn key at 45 degrees. No tricks: the single key is the whole brand.',
    site: 'Night blue with a pale sky tint. Big photographic key, crisp and calm.',
    c: { bg: '#0f1a2e', fg: '#9fd6ff', accent: '#ffffff' },
    mark: (c) => `<g transform="rotate(-45 32 32)"><path fill="${c.fg}" fill-rule="evenodd" d="M3 32a11 11 0 1 1 22 0a11 11 0 1 1-22 0Z M9.5 32a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z"/><rect x="23" y="29.4" width="35" height="5.2" fill="${c.fg}"/><rect x="44" y="34" width="5" height="9" fill="${c.accent}"/><rect x="53" y="34" width="5" height="6.5" fill="${c.accent}"/></g>`,
    word: 'keypool',
  },
  {
    id: 'r2-pixel-key',
    name: 'Block key',
    idea: 'A key built from square blocks, like a bitmap. Plain, digital, and it holds up at tiny sizes.',
    site: 'Loud sun-yellow with black. Chunky grid layout, big flat blocks, friendly type.',
    c: { bg: '#ffd84a', fg: '#111111', accent: '#e8342a' },
    mark: (c) => {
      const rows = ['.XXX........', 'X...X.......', 'X...XXXXXXXX', 'X...X..AA.A.', '.XXX...AA.A.'];
      const out = [];
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        out.push(`<rect x="${2 + x * 5}" y="${19.5 + y * 5}" width="5" height="5" fill="${ch === 'A' ? c.accent : c.fg}"/>`);
      }));
      return out.join('');
    },
    word: 'keypool',
  },
  {
    id: 'r2-drop',
    name: 'Drop',
    idea: 'A water drop with a keyhole in it: a pool, and a secret held inside.',
    site: 'Deep sea-blue with white. Soft, rounded shapes and slow ripples on scroll.',
    c: { bg: '#0b6173', fg: '#ffffff', accent: '#8de3ee' },
    mark: (c) => `<path fill="${c.fg}" fill-rule="evenodd" d="M32 5C32 5 12 26 12 38a20 20 0 0 0 40 0C52 26 32 5 32 5Z M29.2 42.78A5.2 5.2 0 1 1 34.8 42.78L36.4 53H27.6Z"/><path fill="none" stroke="${c.accent}" stroke-width="2.4" stroke-linecap="round" d="M20 58q12 4 24 0"/>`,
    word: 'keypool',
  },
  {
    id: 'r2-monoline',
    name: 'Monoline key',
    idea: 'A key drawn with one even line and round ends, and a single dot. Light, friendly, easy to animate.',
    site: 'Lavender and indigo with one pink dot. Rounded, airy, line-drawn illustrations.',
    c: { bg: '#efeaff', fg: '#2b1b6b', accent: '#ff5c8a' },
    mark: (c) => `<g fill="none" stroke="${c.fg}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="21" cy="21" r="11"/><path d="M29 29L54 54M43 43l7-7M50 50l6-6"/></g><circle cx="21" cy="21" r="3.4" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'r2-k-ring',
    name: 'k with a ring',
    idea: 'A lowercase k whose tall stem ends in a key ring. Friendly, easy to recognise as a letter.',
    site: 'Terracotta and white. Warm, human, rounded type, hand-drawn touches.',
    c: { bg: '#c8553d', fg: '#ffffff', accent: '#ffd9c9' },
    mark: (c) => `<g fill="none" stroke="${c.fg}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="15" r="8"/><path d="M24 23V56M24 42L45 25M31 36L46 56"/></g><circle cx="24" cy="15" r="2.6" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'r2-dial',
    name: 'Dial',
    idea: 'A safe dial with one marked tick. The one number that opens it is yours alone.',
    site: 'Brushed grey panel, black dial, one orange mark. Real knobs, bevels and LED lights.',
    c: { bg: '#cdd1d4', fg: '#16181b', accent: '#ff6a00' },
    mark: (c) => {
      const ticks = [];
      for (let i = 0; i < 24; i++) {
        const deg = i * 15 - 90;
        const [x1, y1] = rot(32, 32, i === 0 ? 17 : 19, deg);
        const [x2, y2] = rot(32, 32, 25.5, deg);
        ticks.push(`<path d="M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${i === 0 ? c.accent : c.fg}" stroke-width="${i === 0 ? 4 : 2.4}" stroke-linecap="butt"/>`);
      }
      return `<circle cx="32" cy="32" r="29" fill="none" stroke="${c.fg}" stroke-width="3.4"/>${ticks.join('')}<circle cx="32" cy="32" r="11" fill="${c.fg}"/><path d="M32 22V32" stroke="${c.bg}" stroke-width="3" stroke-linecap="round"/>`;
    },
    word: 'keypool',
  },
  {
    id: 'r2-ghost',
    name: 'Key and ghost',
    idea: 'A solid key above a dashed ghost of itself. The second secret is gone, and only one is left.',
    site: 'Black and white with one red-orange dot. Stark, big type, lots of empty space.',
    c: { bg: '#0b0b0f', fg: '#ffffff', accent: '#ff4a1c' },
    mark: (c) => `<g fill="none" stroke="${c.fg}" stroke-width="5" stroke-linecap="round"><circle cx="16" cy="22" r="9"/><path d="M26 22H58M46 22v8M54 22v6"/></g><g fill="none" stroke="${c.fg}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6" opacity=".6"><circle cx="16" cy="46" r="9"/><path d="M26 46H58M46 46v8M54 46v6"/></g><circle cx="16" cy="22" r="3" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'r2-bracket',
    name: 'Bracket one',
    idea: 'The numeral 1 held in square brackets, like one item in a list. Technical, exact, quiet.',
    site: 'White page with black ink and one electric violet. Code-like grid, tidy and precise.',
    c: { bg: '#ffffff', fg: '#0d0d12', accent: '#6b3dff' },
    mark: (c) => `<g fill="none" stroke="${c.fg}" stroke-width="5" stroke-linecap="butt" stroke-linejoin="miter"><path d="M22 10H9V54H22"/><path d="M42 10H55V54H42"/></g><path fill="${c.accent}" d="M30 14H39V50H32.4V25.5L25.5 28.5V21.5Z"/>`,
    word: 'keypool',
  },
];

const svgOf = (k, size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${k.name} logo">${k.mark(k.c)}</svg>`;
for (const k of concepts) writeFileSync(`logo/svg/${k.id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${k.mark(k.c)}</svg>\n`);

const card = (k, i) => `
<article class="card" style="--bg:${k.c.bg};--fg:${k.c.fg};--ac:${k.c.accent}">
  <h2><span>${String.fromCharCode(71 + i)}</span> ${k.name}</h2>
  <div class="stage">
    <div class="big">${svgOf(k, 170)}</div>
    <div class="lock">${svgOf(k, 46)}<span class="word">${k.word}</span></div>
    <div class="small"><span>${svgOf(k, 32)}</span><span>${svgOf(k, 20)}</span><span>${svgOf(k, 16)}</span><em>app icon / tab / favicon</em></div>
  </div>
  <p class="idea">${k.idea}</p>
  <p class="site"><b>Site built around it:</b> ${k.site}</p>
</article>`;

writeFileSync('logo/round2.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Keypool logo concepts, round 2</title>
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
<header><h1>Keypool: logo concepts, round 2</h1><p>Eight new ideas, G to N. The first six are still on <a href="index.html">the first page</a>. Same rule: pick one and the whole site is built from it.</p></header>
<main class="grid">${concepts.map(card).join('')}</main>
</body></html>
`);
console.log('wrote', concepts.length, 'concepts');
