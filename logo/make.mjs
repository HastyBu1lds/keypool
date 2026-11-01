// Generates the logo concept SVGs (logo/svg/*.svg) and the comparison page (logo/index.html).
// Run: node logo/make.mjs
import { writeFileSync } from 'node:fs';

const wave = (n, r, amp, steps = 360) => {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const rr = r + amp * Math.sin(n * t);
    pts.push(`${(32 + rr * Math.cos(t)).toFixed(2)} ${(32 + rr * Math.sin(t)).toFixed(2)}`);
  }
  return 'M' + pts.join('L') + 'Z';
};

// Each mark is drawn on a 64x64 grid. c = { bg, fg, accent }.
const concepts = [
  {
    id: 'one-keyhole',
    name: 'One, with a keyhole',
    idea: 'A heavy numeral 1 with a keyhole cut into the stem. It says "one secret" and "key" in a single shape.',
    site: 'Swiss: grey-blue field, ink, one orange-red signal, giant numerals.',
    c: { bg: '#dce6ee', fg: '#0b1f33', accent: '#ff4a1c' },
    mark: (c) => `<path fill="${c.fg}" fill-rule="evenodd" d="M29 5H45V59H29V24L14 31V17Z M37 19.5a4.6 4.6 0 1 0 0 9.2a4.6 4.6 0 1 0 0-9.2Z M34.2 28H39.8L41.2 42H32.8Z"/><rect x="29" y="52" width="16" height="7" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'ripple',
    name: 'Ripple',
    idea: 'Concentric rings around one solid dot: a pool, with a single key at the centre.',
    site: 'Warm dark: deep teal, bone, amber. Calm, slow water-like motion, no neon.',
    c: { bg: '#0e2a2b', fg: '#f3e9d2', accent: '#f0a93b' },
    mark: (c) => `<circle cx="32" cy="32" r="27" fill="none" stroke="${c.fg}" stroke-width="4"/><circle cx="32" cy="32" r="18" fill="none" stroke="${c.fg}" stroke-width="4" opacity=".7"/><circle cx="32" cy="32" r="9" fill="none" stroke="${c.fg}" stroke-width="4" opacity=".45"/><circle cx="32" cy="32" r="4.5" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'seal',
    name: 'Seal',
    idea: 'A wax-seal edge with a single stroke inside. A signed, sealed secret that only you hold.',
    site: 'Quiet luxury: forest-black, brass, bone. Serif-led headlines, gilded hairlines.',
    c: { bg: '#0f1a14', fg: '#c9a15b', accent: '#ede6d3' },
    mark: (c) => `<path fill="${c.fg}" d="${wave(14, 27, 1.9)}"/><circle cx="32" cy="32" r="19.5" fill="none" stroke="${c.bg}" stroke-width="1.6"/><path fill="${c.bg}" d="M29 17H35.5V47H30.5V26.5L24 29.5V23.5Z"/>`,
    word: 'keypool',
  },
  {
    id: 'k-key',
    name: 'K key',
    idea: 'A K whose stem carries a key-bow hole. A monogram that is also a key.',
    site: 'Aubergine dark with blush pink: warm, soft-edged, editorial type.',
    c: { bg: '#2a1233', fg: '#ffc9dc', accent: '#ff7fa8' },
    mark: (c) => `<path fill="${c.fg}" fill-rule="evenodd" d="M12 8H23V56H12Z M17.5 13.5a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0-6.6Z M23 30L43 8H57L31 38H23Z M25 40V34L33 34L57 56H43Z"/><rect x="46" y="48" width="11" height="8" fill="${c.accent}"/>`,
    word: 'keypool',
  },
  {
    id: 'tiles',
    name: 'One of a pool',
    idea: 'A grid of identical keys with one picked out. Many separate keys in a pool, none linked.',
    site: 'Sage and forest ink with one coral tile: tidy, grid-based, tactile.',
    c: { bg: '#e4eadf', fg: '#12332a', accent: '#ff6b4a' },
    mark: (c) => {
      const out = [];
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
        const mid = r === 1 && q === 1;
        out.push(`<rect x="${7 + q * 18}" y="${7 + r * 18}" width="14" height="14" rx="3" fill="${mid ? c.accent : c.fg}"/>`);
      }
      return out.join('');
    },
    word: 'keypool',
  },
  {
    id: 'wordmark',
    name: 'Wordmark with one dot',
    idea: 'No symbol: heavy lowercase letters with a single dot. The dot is the one secret.',
    site: 'Pure white page, black type, one cobalt dot. Very typographic, almost no decoration.',
    c: { bg: '#ffffff', fg: '#0a0a0f', accent: '#2f3cff' },
    mark: (c) => `<circle cx="32" cy="32" r="12" fill="${c.accent}"/>`,
    word: 'keypool',
    wordOnly: true,
  },
];

const svgOf = (k, size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${k.name} logo">${k.mark(k.c)}</svg>`;
const withBg = (k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${k.c.bg}"/>${k.mark(k.c)}</svg>`;

for (const k of concepts) writeFileSync(`logo/svg/${k.id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${k.mark(k.c)}</svg>\n`);

const card = (k, i) => `
<article class="card" style="--bg:${k.c.bg};--fg:${k.c.fg};--ac:${k.c.accent}">
  <h2><span>${String.fromCharCode(65 + i)}</span> ${k.name}</h2>
  <div class="stage">
    <div class="big">${k.wordOnly ? `<p class="wm">keypool<i></i></p>` : svgOf(k, 170)}</div>
    <div class="lock">
      ${k.wordOnly ? '' : svgOf(k, 46)}
      <span class="word">${k.wordOnly ? 'keypool<i></i>' : k.word}</span>
    </div>
    <div class="small">
      <span>${k.wordOnly ? '<i class="dot"></i>' : svgOf(k, 32)}</span>
      <span>${k.wordOnly ? '<i class="dot s"></i>' : svgOf(k, 20)}</span>
      <span>${k.wordOnly ? '<i class="dot xs"></i>' : svgOf(k, 16)}</span>
      <em>app icon / tab / favicon</em>
    </div>
  </div>
  <p class="idea">${k.idea}</p>
  <p class="site"><b>Site built around it:</b> ${k.site}</p>
</article>`;

writeFileSync('logo/index.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Keypool logo concepts</title>
<style>
@font-face { font-family: "Public Sans"; src: url("fonts/public-sans.woff2") format("woff2"); font-weight: 100 900; }
*{box-sizing:border-box} body{margin:0;background:#eceff2;color:#0b1f33;font:400 16px/1.45 "Public Sans",system-ui,sans-serif;padding:28px clamp(14px,4vw,48px) 60px}
header h1{font-size:clamp(1.8rem,4vw,2.8rem);letter-spacing:-.03em;margin:0 0 6px;font-weight:900}
header p{margin:0 0 26px;color:#3f5469;max-width:46em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:22px}
.card{background:#fff;border:2px solid #0b1f33;display:grid;grid-template-rows:auto auto 1fr auto;padding:0}
.card h2{margin:0;padding:12px 16px;font-size:1.05rem;border-bottom:2px solid #0b1f33}
.card h2 span{display:inline-grid;place-items:center;width:26px;height:26px;background:#0b1f33;color:#fff;margin-right:8px;font-size:.9rem}
.stage{background:var(--bg);color:var(--fg);display:grid;gap:18px;padding:22px 18px;justify-items:center}
.big svg{display:block}.wm{margin:0;font-size:4rem;font-weight:900;letter-spacing:-.07em;line-height:1;white-space:nowrap}
.wm i,.word i{display:inline-block;width:.16em;height:.16em;border-radius:50%;background:var(--ac);margin-left:.04em}
.lock{display:flex;align-items:center;gap:12px}.word{font-size:2rem;font-weight:800;letter-spacing:-.04em}
.small{display:flex;align-items:center;gap:14px;opacity:.95}.small em{font-style:normal;font-size:.75rem;opacity:.7}
.dot{display:inline-block;border-radius:50%;background:var(--ac);width:20px;height:20px}.dot.s{width:13px;height:13px}.dot.xs{width:9px;height:9px}
.idea,.site{margin:0;padding:12px 16px 0;font-size:.95rem}.site{padding-bottom:16px;color:#3f5469}.site b{color:#0b1f33}
</style></head><body>
<header><h1>Keypool: logo concepts</h1><p>Six different ideas. Each one shows the mark large, as a logo with the name, and tiny (tab and app icon). Pick the one you like and I will build the whole site around it: colours, type and layout all come from the logo.</p></header>
<main class="grid">${concepts.map(card).join('')}</main>
</body></html>
`);
console.log('wrote', concepts.length, 'concepts');
