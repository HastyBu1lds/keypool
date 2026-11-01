// Expands concept "Drop" (drop + keyhole). Run: node logo/make-drop.mjs -> logo/drop.html + logo/svg/drop-*.svg
import { writeFileSync } from 'node:fs';

const DROP = 'M32 5C32 5 12 26 12 38a20 20 0 0 0 40 0C52 26 32 5 32 5Z';
// One outline (round head + slot) so the two shapes never overlap; overlapping them under even-odd fill left a white speck.
const HOLE = 'M29.2 42.78A5.2 5.2 0 1 1 34.8 42.78L36.4 53H27.6Z';
let uid = 0;

const variants = [
  {
    id: 'classic', name: 'Classic', note: 'The drop with a keyhole cut out and a single ripple under it. The version you picked.',
    mark: (c) => `<path fill="${c.fg}" fill-rule="evenodd" d="${DROP} ${HOLE}"/><path fill="none" stroke="${c.accent}" stroke-width="2.4" stroke-linecap="round" d="M20 58q12 4 24 0"/>`,
  },
  {
    id: 'pool', name: 'In the pool', note: 'The drop sits above three ripples. It is the "pool" in Keypool, and the ripples are easy to animate.',
    mark: (c) => `<g transform="translate(32 27) scale(.76) translate(-32 -27)"><path fill="${c.fg}" fill-rule="evenodd" d="${DROP} ${HOLE}"/></g><g fill="none" stroke="${c.accent}" stroke-width="2.4"><ellipse cx="32" cy="54.5" rx="11" ry="2.6"/><ellipse cx="32" cy="54.5" rx="19" ry="4.4" opacity=".7"/><ellipse cx="32" cy="54.5" rx="27" ry="6.2" opacity=".4"/></g>`,
  },
  {
    id: 'outline', name: 'Outline', note: 'A thick outline drop with the keyhole filled in the accent colour. Lighter, and good on busy backgrounds.',
    mark: (c) => `<path fill="none" stroke="${c.fg}" stroke-width="5" stroke-linejoin="round" d="${DROP}"/><path fill="${c.accent}" d="${HOLE}"/>`,
  },
  {
    id: 'open', name: 'Open slot', note: 'The keyhole slot runs out through the bottom of the drop, as if it is dripping from the lock. Most distinctive.',
    mark: (c) => { const u = ++uid; return `<defs><mask id="m${u}"><rect width="64" height="64" fill="#fff"/><circle cx="32" cy="38.4" r="5.2" fill="#000"/><path d="M29.2 42H34.8L36.4 62H27.6Z" fill="#000"/></mask></defs><path mask="url(#m${u})" fill="${c.fg}" d="${DROP}"/><circle cx="32" cy="60.5" r="1.9" fill="${c.accent}"/>`; },
  },
  {
    id: 'halves', name: 'Two tones', note: 'The drop in two tones, light on one side and shaded on the other, so it looks round. The keyhole is cut out.',
    mark: (c) => `<path fill="${c.fg}" d="M32 5C32 5 12 26 12 38a20 20 0 0 0 20 20Z"/><path fill="${c.accent}" d="M32 5C32 5 52 26 52 38a20 20 0 0 1-20 20Z"/><path fill="${c.bg}" d="${HOLE}"/>`,
  },
  {
    id: 'gloss', name: 'Glossy', note: 'A solid drop with a highlight along the edge and the keyhole cut out. Warmer, more like a real droplet.',
    mark: (c) => `<path fill="${c.fg}" fill-rule="evenodd" d="${DROP} ${HOLE}"/><path fill="none" stroke="${c.accent}" stroke-width="3" stroke-linecap="round" d="M19.5 39C19.5 33 22.5 28 26 23"/>`,
  },
  {
    id: 'drops', name: 'Pool of drops', note: 'One drop with a keyhole among smaller plain drops. One key in a pool of keys, and the other keys stay hidden.',
    mark: (c) => `<g transform="translate(31 31) scale(.7) translate(-32 -31)"><path fill="${c.fg}" fill-rule="evenodd" d="${DROP} ${HOLE}"/></g><g fill="${c.accent}"><path transform="translate(5 41) scale(.3)" d="${DROP}"/><path transform="translate(50 28) scale(.22)" d="${DROP}"/><path transform="translate(46 49) scale(.26)" d="${DROP}"/></g>`,
  },
  {
    id: 'line', name: 'Fine line', note: 'The drop and keyhole drawn with a thin, even line. Quiet and elegant, best at larger sizes.',
    mark: (c) => `<path fill="none" stroke="${c.fg}" stroke-width="3" stroke-linejoin="round" d="${DROP}"/><circle cx="32" cy="38.4" r="4.6" fill="none" stroke="${c.accent}" stroke-width="3"/><path d="M32 43.6V51" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>`,
  },
];

const palettes = [
  { id: 'sea', name: 'Sea', c: { bg: '#0b6173', fg: '#ffffff', accent: '#8de3ee' } },
  { id: 'shallows', name: 'Shallows', c: { bg: '#e8f6f8', fg: '#0b3a4a', accent: '#19b5c9' } },
  { id: 'midnight', name: 'Midnight', c: { bg: '#0a1428', fg: '#e8f6ff', accent: '#4fd1ff' } },
  { id: 'coral', name: 'Coral', c: { bg: '#ff7a5c', fg: '#ffffff', accent: '#0b3a4a' } },
  { id: 'lagoon', name: 'Lagoon', c: { bg: '#0e4d3f', fg: '#f2fff9', accent: '#7ff0c1' } },
  { id: 'dusk', name: 'Dusk', c: { bg: '#2e1a47', fg: '#ffe6f2', accent: '#ff8fb3' } },
];

const base = palettes[0].c;
const svg = (v, c, size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Keypool drop logo, ${v.name}">${v.mark(c)}</svg>`;
for (const v of variants) writeFileSync(`logo/svg/drop-${v.id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${v.mark({ ...base, bg: 'transparent' })}</svg>\n`);

const vcard = (v, i) => `
<article class="card" style="--bg:${base.bg};--fg:${base.fg};--ac:${base.accent}">
  <h3><span>${i + 1}</span> ${v.name}</h3>
  <div class="stage"><div>${svg(v, base, 140)}</div><div class="row">${svg(v, base, 44)}<b class="word">keypool</b></div><div class="row mini">${svg(v, base, 28)}${svg(v, base, 20)}${svg(v, base, 16)}</div></div>
  <p>${v.note}</p>
</article>`;

const classic = variants[0];
const pcard = (p) => `
<article class="card" style="--bg:${p.c.bg};--fg:${p.c.fg};--ac:${p.c.accent}">
  <h3>${p.name}</h3>
  <div class="stage"><div>${svg(classic, p.c, 110)}</div><div class="row">${svg(classic, p.c, 38)}<b class="word">keypool</b></div>
  <div class="sw"><i style="background:${p.c.bg}"></i><i style="background:${p.c.fg}"></i><i style="background:${p.c.accent}"></i></div></div>
</article>`;

writeFileSync('logo/drop.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Keypool drop: expanded</title>
<style>
@font-face { font-family: "Public Sans"; src: url("fonts/public-sans.woff2") format("woff2"); font-weight: 100 900; }
*{box-sizing:border-box} body{margin:0;background:#eceff2;color:#0b1f33;font:400 16px/1.45 "Public Sans",system-ui,sans-serif;padding:28px clamp(14px,4vw,48px) 70px}
h1{font-size:clamp(1.8rem,4vw,2.8rem);letter-spacing:-.03em;margin:0 0 6px;font-weight:900}
h2{font-size:1.5rem;margin:44px 0 6px;letter-spacing:-.02em;border-top:2px solid #0b1f33;padding-top:12px}
.lead{margin:0 0 20px;color:#3f5469;max-width:48em}
a{color:inherit}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
.card{background:#fff;border:2px solid #0b1f33;display:grid;grid-template-rows:auto auto 1fr}
.card h3{margin:0;padding:10px 14px;font-size:1rem;border-bottom:2px solid #0b1f33}
.card h3 span{display:inline-grid;place-items:center;width:24px;height:24px;background:#0b1f33;color:#fff;margin-right:8px;font-size:.85rem}
.card p{margin:0;padding:12px 14px 16px;font-size:.92rem;color:#3f5469}
.stage{background:var(--bg);color:var(--fg);display:grid;gap:14px;padding:18px 14px;justify-items:center}
.stage svg{display:block}.row{display:flex;align-items:center;gap:10px}.row.mini{gap:12px;opacity:.95}
.word{font-size:1.7rem;font-weight:800;letter-spacing:-.04em}
.sw{display:flex;gap:6px}.sw i{width:26px;height:26px;border:1px solid rgba(128,128,128,.5)}
.formats{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
.fmt{border:2px solid #0b1f33;background:#fff}.fmt h3{margin:0;padding:10px 14px;font-size:1rem;border-bottom:2px solid #0b1f33}
.fmt .box{display:grid;place-items:center;gap:10px;padding:22px 14px;min-height:190px}
.fmt .box.sea{background:#0b6173;color:#fff}.fmt .box.white{background:#fff;color:#0b3a4a}.fmt .box.black{background:#000;color:#fff}.fmt .box.photo{background:linear-gradient(160deg,#7fd1e0,#0b6173 55%,#06323d);color:#fff}
.app{width:112px;height:112px;border-radius:26px;background:#0b6173;display:grid;place-items:center}
.avatar{width:112px;height:112px;border-radius:50%;background:#0b6173;display:grid;place-items:center;overflow:hidden}
.fav{display:grid;place-items:center;width:20px;height:20px;border-radius:4px;background:#0b6173}
.stack{display:grid;justify-items:center;gap:6px}.stack .word{font-size:2.2rem}
/* animated intro */
.anim{border:2px solid #0b1f33;background:#0b6173;display:grid;place-items:center;min-height:340px;overflow:hidden;position:relative}
.anim svg{width:min(320px,70vw);height:auto;overflow:visible}
.rip{fill:none;stroke:#8de3ee;stroke-width:1.2;transform-box:fill-box;transform-origin:center;opacity:0;animation:rip 4.2s cubic-bezier(.2,.7,.2,1) infinite}
.rip.b{animation-delay:.25s}.rip.c{animation-delay:.5s}
.fall{transform-box:fill-box;transform-origin:center;animation:fall 4.2s cubic-bezier(.5,0,.8,.6) infinite}
.sink{transform-box:fill-box;transform-origin:50% 100%;animation:rise 4.2s cubic-bezier(.2,.8,.2,1) infinite}
@keyframes fall{0%{transform:translateY(-70px) scale(.35);opacity:0}8%{opacity:1}34%{transform:translateY(0) scale(.35);opacity:1}36%{opacity:0}100%{opacity:0}}
@keyframes rip{0%,34%{transform:scale(.1);opacity:0}38%{opacity:.9}100%{transform:scale(1);opacity:0}}
@keyframes rise{0%,36%{transform:scale(0);opacity:0}52%{transform:scale(1.08);opacity:1}60%{transform:scale(1)}92%{transform:scale(1);opacity:1}100%{transform:scale(1);opacity:0}}
@media (prefers-reduced-motion:reduce){.rip,.fall,.sink{animation:none}.fall{opacity:0}.sink{opacity:1;transform:none}}
.next{margin-top:32px;padding:16px;border:2px solid #0b1f33;background:#fff}.next p{margin:.3em 0}
</style></head><body>
<h1>The drop, expanded</h1>
<p class="lead">Back to <a href="index.html">A to F</a>, <a href="round2.html">G to N</a>, <a href="round3.html">O to U</a>. Here are eight ways to draw the drop with a keyhole, six colour palettes, how it works in different formats, and a small animated version.</p>

<h2>1. Eight ways to draw it</h2>
<p class="lead">All in the sea palette so you can compare the shapes. The small row on each card shows how it holds up at tab and app-icon size.</p>
<div class="grid">${variants.map(vcard).join('')}</div>

<h2>2. Six palettes</h2>
<p class="lead">The Classic drop in each. Any palette works with any of the eight shapes.</p>
<div class="grid">${palettes.map(pcard).join('')}</div>

<h2>3. In use</h2>
<div class="formats">
  <div class="fmt"><h3>Horizontal</h3><div class="box sea"><div class="row">${svg(classic, base, 56)}<b class="word">keypool</b></div></div></div>
  <div class="fmt"><h3>Stacked</h3><div class="box sea"><div class="stack">${svg(classic, base, 84)}<b class="word">keypool</b></div></div></div>
  <div class="fmt"><h3>App icon</h3><div class="box white"><div class="app">${svg(classic, base, 76)}</div></div></div>
  <div class="fmt"><h3>Profile picture</h3><div class="box white"><div class="avatar">${svg(classic, base, 78)}</div></div></div>
  <div class="fmt"><h3>One colour, black on white</h3><div class="box white"><div class="row">${svg(classic, { bg: '#fff', fg: '#000', accent: '#000' }, 56)}<b class="word" style="color:#000">keypool</b></div></div></div>
  <div class="fmt"><h3>One colour, white on black</h3><div class="box black"><div class="row">${svg(classic, { bg: '#000', fg: '#fff', accent: '#fff' }, 56)}<b class="word">keypool</b></div></div></div>
  <div class="fmt"><h3>On a photo or gradient</h3><div class="box photo"><div class="row">${svg(classic, { bg: '#0b6173', fg: '#fff', accent: '#fff' }, 56)}<b class="word">keypool</b></div></div></div>
  <div class="fmt"><h3>Browser tab</h3><div class="box white"><div class="row"><span class="fav">${svg(classic, base, 14)}</span><span>Keypool - one secret, not two</span></div></div></div>
</div>

<h2>4. It moves</h2>
<p class="lead">A drop falls into the pool, ripples spread out, and the drop with its keyhole rises from the water. The site could play this on load, and again each time you make a wallet.</p>
<div class="anim">
  <svg viewBox="-20 -30 104 104" aria-label="Animated drop logo">
    <g><ellipse class="rip a" cx="32" cy="56" rx="30" ry="7"/><ellipse class="rip b" cx="32" cy="56" rx="30" ry="7"/><ellipse class="rip c" cx="32" cy="56" rx="30" ry="7"/></g>
    <g class="fall"><path fill="#8de3ee" d="M32 5C32 5 12 26 12 38a20 20 0 0 0 40 0C52 26 32 5 32 5Z"/></g>
    <g class="sink"><path fill="#fff" fill-rule="evenodd" d="${DROP} ${HOLE}"/></g>
  </svg>
</div>

<div class="next"><p><b>Next:</b> pick a shape (1 to 8) and a palette, and I will build the whole site around it. The colours, the type, the ripple motion and the page layout all come from the drop.</p></div>
</body></html>
`);
console.log('wrote', variants.length, 'variants,', palettes.length, 'palettes');
