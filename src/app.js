import {
  Entropy, TYPES, newKey, keysFromSecret, solanaJsonArray,
  buildWalletFile, encryptWalletFile, decryptWalletFile, parseWalletText, keysFromWalletObject,
} from './core.js';
import { startDither } from './dither.js';
import { decryptText, cancelDecrypt } from './decrypt.js';
import { qrSvg } from './qr.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const small = () => matchMedia('(max-width: 760px)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k in e) e[k] = v;
    else e.setAttribute(k, v);
  }
  e.append(...kids);
  return e;
}

const entropy = new Entropy();
const state = { keys: [], dirty: false, sel: -1 };

// ---------------------------------------------------------------- windows
const wins = {};
let zTop = 10;
const tasksEl = $('#tasks');

function setupWin(id) {
  const root = $('#w-' + id);
  const w = (wins[id] = { id, root, task: null, placed: false });
  root.addEventListener('pointerdown', () => focusWin(id));
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.tb');
    if (!b) return;
    if (b.dataset.act === 'close') closeWin(id);
    if (b.dataset.act === 'min') minWin(id);
    if (b.dataset.act === 'max') root.classList.toggle('max');
  });
  const bar = $('.titlebar', root);
  bar.addEventListener('dblclick', (e) => {
    if (!e.target.closest('button') && $('[data-act="max"]', root)) root.classList.toggle('max');
  });
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || small() || root.classList.contains('max')) return;
    const r = root.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    w.moved = true;
    const move = (ev) => {
      root.style.left = clamp(ev.clientX - dx, 90 - r.width, innerWidth - 90) + 'px';
      root.style.top = clamp(ev.clientY - dy, 0, innerHeight - 36 - 24) + 'px';
    };
    const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
  });
  return w;
}
['main', 'readme', 'key', 'import', 'dialog'].forEach(setupWin);

const spots = {
  main: () => [110, 18],
  readme: () => [Math.max(110, innerWidth - 420 - 28), 64],
  key: () => [150, 56],
  import: () => [210, 90],
  dialog: (w) => [(innerWidth - w) / 2, Math.max(20, innerHeight / 2 - 190)],
};

function place(w) {
  const [x, y] = spots[w.id](w.root.offsetWidth);
  w.root.style.left = clamp(x, 0, Math.max(0, innerWidth - w.root.offsetWidth)) + 'px';
  w.root.style.top = clamp(y, 0, Math.max(0, innerHeight - 160)) + 'px';
}
// windows nobody has dragged follow the screen size (also covers a page that loads while its tab has no size yet)
addEventListener('resize', () => Object.values(wins).forEach((w) => w.placed && !w.moved && !w.root.hidden && place(w)));

function openWin(id) {
  const w = wins[id];
  w.root.hidden = false;
  w.root.classList.remove('min');
  if (!w.placed) { place(w); w.placed = true; }
  if (!w.task && id !== 'dialog') {
    w.task = el('button', { class: 'task', type: 'button' });
    w.task.append($('.titlebar h1, .titlebar h2', w.root).textContent);
    w.task.addEventListener('click', () => {
      if (!w.root.classList.contains('min') && w.root.classList.contains('active')) minWin(id);
      else openWin(id);
    });
    tasksEl.append(w.task);
  }
  focusWin(id);
}
function focusWin(id) {
  if (id === 'dialog') {
    wins.dialog.root.classList.add('active');
    wins.dialog.root.style.zIndex = 1000;
    return;
  }
  for (const o of Object.values(wins)) {
    const on = o.id === id;
    o.root.classList.toggle('active', on);
    o.task?.classList.toggle('active', on && !o.root.classList.contains('min'));
  }
  wins[id].root.style.zIndex = id === 'dialog' ? 1000 : ++zTop;
}
function minWin(id) {
  const w = wins[id];
  w.root.classList.add('min');
  w.root.classList.remove('active');
  w.task?.classList.remove('active');
  frontmost();
}
function closeWin(id) {
  const w = wins[id];
  w.root.hidden = true;
  w.root.classList.remove('active', 'min', 'max');
  w.task?.remove();
  w.task = null;
  if (id === 'key') hideSecret(true);
  if (id === 'import') { $('#im-text').value = ''; checkImport(); }
  frontmost();
}
function frontmost() {
  const open = Object.values(wins).filter((w) => !w.root.hidden && !w.root.classList.contains('min') && w.id !== 'dialog');
  open.sort((a, b) => (+b.root.style.zIndex || 0) - (+a.root.style.zIndex || 0));
  if (open[0]) focusWin(open[0].id);
}

// ---------------------------------------------------------------- menus, start, icons
function closeMenus() {
  $$('.drop').forEach((d) => (d.hidden = true));
  $$('.mbtn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  $('#startmenu').hidden = true;
  $('#start').classList.remove('active');
}
document.addEventListener('click', (e) => {
  const mb = e.target.closest('.mbtn');
  const was = mb && mb.getAttribute('aria-expanded') === 'true';
  const start = e.target.closest('#start');
  const startWas = !$('#startmenu').hidden;
  const open = e.target.closest('[data-open]');
  const cmd = e.target.closest('[data-cmd]');
  closeMenus();
  if (mb && !was) { mb.setAttribute('aria-expanded', 'true'); mb.nextElementSibling.hidden = false; }
  if (start && !startWas) { $('#startmenu').hidden = false; start.classList.add('active'); }
  if (open) openWin(open.dataset.open);
  if (cmd) commands[cmd.dataset.cmd]?.();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });

// ---------------------------------------------------------------- dialog
function dialog({ title, message, fields = [], buttons = [{ label: 'OK', value: 'ok', primary: true }], validate, bar = false }) {
  let done;
  const p = new Promise((res) => (done = res));
  $('#t-dialog').textContent = title;
  $('#d-msg').textContent = message;
  const fe = $('#d-fields');
  fe.replaceChildren();
  const err = el('p', { class: 'err', role: 'alert' });
  fields.forEach((f) => {
    fe.append(el('label', { class: 'fld' }, f.label, el('input', { name: f.name, type: f.type || 'text', autocomplete: 'off' })));
  });
  fe.append(err);
  $('#d-bar').hidden = !bar;
  const be = $('#d-buttons');
  be.replaceChildren();
  const cancel = buttons.find((b) => !b.primary && b.value === 'no');
  const read = () => Object.fromEntries(fields.map((f) => [f.name, $(`[name="${f.name}"]`, fe).value]));
  const finish = (value, primary) => {
    const vals = read();
    if (primary && validate) {
      const m = validate(vals);
      if (m) { err.textContent = m; return; }
    }
    cleanup();
    done({ value, fields: vals });
  };
  buttons.forEach((b) => {
    const btn = el('button', { class: 'btn' + (b.primary ? ' primary' : ''), type: b.primary ? 'submit' : 'button' }, b.label);
    if (!b.primary) btn.addEventListener('click', () => finish(b.value, false));
    be.append(btn);
  });
  const primary = buttons.find((b) => b.primary);
  $('#d-form').onsubmit = (e) => { e.preventDefault(); if (primary) finish(primary.value, true); };
  const onKey = (e) => { if (e.key === 'Escape' && cancel) finish(cancel.value, false); };
  document.addEventListener('keydown', onKey);
  const cleanup = () => {
    document.removeEventListener('keydown', onKey);
    $('#shade').hidden = true;
    closeWin('dialog');
    $('#d-form').onsubmit = null;
  };
  $('#shade').hidden = false;
  openWin('dialog');
  (fe.querySelector('input') || be.querySelector('.primary') || be.querySelector('button'))?.focus();
  p.close = cleanup;
  return p;
}
const notice = (title, message) => dialog({ title, message });

// ---------------------------------------------------------------- helpers
const setStatus = (t) => ($('#st-main').textContent = t);
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  const t = el('textarea', { value: text });
  t.setAttribute('readonly', '');
  document.body.append(t);
  t.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  t.remove();
  return ok;
}
function download(name, text) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' })), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1-');

// ---------------------------------------------------------------- pool list
function render() {
  const rows = $('#rows');
  rows.replaceChildren();
  state.keys.forEach((k, i) => {
    const tr = el('tr', { tabIndex: 0, class: i === state.sel ? 'sel' : '' },
      el('td', {}, String(i + 1)), el('td', { title: k.address }, k.address));
    tr.addEventListener('click', () => select(i));
    tr.addEventListener('dblclick', () => showKey(i));
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') showKey(i);
      if (e.key === 'ArrowDown') { e.preventDefault(); rows.children[i + 1]?.focus(); select(Math.min(i + 1, state.keys.length - 1)); rows.children[state.sel]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); select(Math.max(i - 1, 0)); rows.children[state.sel]?.focus(); }
    });
    rows.append(tr);
  });
  const n = state.keys.length;
  $('#empty').hidden = n > 0;
  $('#pool-title').textContent = `Your wallets: ${n}`;
  $('#pool-state').textContent = n ? (state.dirty ? 'NOT SAVED YET' : 'saved') : '';
  const stepNow = !n ? 1 : state.dirty ? 2 : 3;
  $$('#steps li').forEach((li) => {
    const s = +li.dataset.step;
    li.classList.toggle('now', s === stepNow);
    li.classList.toggle('done', s < stepNow);
  });
  $('#pool-state').style.color = state.dirty && n ? 'var(--danger)' : '';
  $('#b-save').disabled = !n;
  $('#b-print').disabled = !n;
  $('#b-details').disabled = state.sel < 0;
  $('#t-main').textContent = state.dirty && n ? 'Keypool - not saved' : 'Keypool';
  if (wins.main.task) wins.main.task.textContent = $('#t-main').textContent;
}
function select(i) {
  state.sel = i;
  $$('#rows tr').forEach((tr, j) => tr.classList.toggle('sel', j === i));
  $('#b-details').disabled = i < 0;
}
function addKeys(list) {
  const have = new Set(state.keys.map((k) => k.address));
  let added = 0;
  for (const k of list) if (!have.has(k.address)) { state.keys.push(k); have.add(k.address); added++; }
  return added;
}

// ---------------------------------------------------------------- key window
let shown = null;
let revealed = false;
const explorer = (k) => `https://solscan.io/account/${k.address}`;
function showKey(i) {
  const k = state.keys[i];
  if (!k) return;
  select(i);
  hideSecret(true);
  shown = k;
  $('#k-type').textContent = TYPES[k.type].label;
  $('#k-addr').textContent = k.address;
  $('#k-qr').innerHTML = qrSvg(k.address, { label: 'QR code of the address' });
  $('#k-explorer').href = explorer(k);
  $('#k-explorer').title = 'Opens Solscan in a new tab. This tells that site the address.';
  openWin('key');
  $('#k-reveal').focus();
}
function hideSecret(clear) {
  revealed = false;
  const s = $('#k-secret');
  cancelDecrypt(s);
  s.removeAttribute('aria-label');
  s.textContent = '•'.repeat(24);
  $('#k-qr-secret').hidden = true;
  $('#k-qr-secret').replaceChildren();
  $('#k-reveal').textContent = 'Show private key';
  $('#k-copy-secret').disabled = true;
  $('#k-copy-json').disabled = true;
  $('#st-key').textContent = 'Private key hidden';
  if (clear) shown = null;
}
$('#k-reveal').addEventListener('click', () => {
  if (!shown) return;
  if (revealed) { hideSecret(false); return; }
  revealed = true;
  $('#k-reveal').textContent = 'Hide private key';
  $('#k-copy-secret').disabled = false;
  $('#k-copy-json').disabled = false;
  $('#k-qr-secret').innerHTML = qrSvg(shown.secret, { label: 'QR code of the private key' });
  $('#k-qr-secret').hidden = false;
  $('#st-key').textContent = 'Private key showing. Nobody else should see this.';
  decryptText($('#k-secret'), shown.secret);
});
$('#k-copy-addr').addEventListener('click', async () => {
  if (shown) $('#st-key').textContent = (await copy(shown.address)) ? 'Address copied' : 'Could not copy. Select it and press Ctrl+C.';
});
$('#k-copy-secret').addEventListener('click', async () => {
  if (shown) $('#st-key').textContent = (await copy(shown.secret)) ? 'Private key copied. Clipboards can be read by other apps.' : 'Could not copy.';
});
$('#k-copy-json').addEventListener('click', async () => {
  if (shown) $('#st-key').textContent = (await copy(solanaJsonArray(shown.secret))) ? 'keypair.json list copied. Clipboards can be read by other apps.' : 'Could not copy.';
});

// ---------------------------------------------------------------- generate / save / open
function generate() {
  const type = 'sol';
  const n = +$('#count').value;
  const before = state.keys.length;
  const list = [];
  for (let i = 0; i < n; i++) list.push(newKey(type, entropy));
  addKeys(list);
  state.dirty = true;
  select(before);
  render();
  $('#rows').children[before]?.scrollIntoView({ block: 'nearest' });
  setStatus(`Made ${n} wallet${n > 1 ? 's' : ''}. Next: press Save backup file.`);
}

async function save() {
  if (!state.keys.length) return;
  let pass = '';
  for (;;) {
    const r = await dialog({
      title: 'Save backup file',
      message: 'This file holds your private keys. You can lock it with a passphrase (a password). If you forget the passphrase, nobody can open the file again. Leave it empty for no lock.',
      fields: [{ name: 'p1', label: 'Passphrase (optional)', type: 'password' }, { name: 'p2', label: 'Repeat passphrase', type: 'password' }],
      buttons: [{ label: 'Save', value: 'ok', primary: true }, { label: 'Cancel', value: 'no' }],
      validate: (f) => (f.p1 !== f.p2 ? 'The two passphrases are different.' : ''),
    });
    if (r.value !== 'ok') return;
    pass = r.fields.p1;
    if (pass) break;
    const c = await dialog({
      title: 'No passphrase',
      message: 'Without a passphrase, anyone who gets this file can spend everything in it. Save it like that?',
      buttons: [{ label: 'Save anyway', value: 'ok', primary: true }, { label: 'Go back', value: 'no' }],
    });
    if (c.value === 'ok') break;
  }
  let out = buildWalletFile(state.keys);
  if (pass) {
    const busy = dialog({ title: 'Locking file', message: 'Mixing your passphrase. This takes a second or two.', buttons: [], bar: true });
    try { out = await encryptWalletFile(out, pass); } finally { busy.close(); }
  }
  const name = `keypool-${stamp()}.dat`;
  download(name, JSON.stringify(out, null, 2));
  state.dirty = false;
  render();
  setStatus(`Saved ${name}`);
  await notice('File saved', `Your browser should have put ${name} in your downloads. Find it and copy it to two other places (a USB stick, another computer). Then press Open a saved file to check that it reads back.`);
}

function openFile() {
  const inp = el('input', { type: 'file' });
  inp.addEventListener('change', async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      if (f.size > 5e6) throw new Error('That file is too big to be a wallet file');
      const parsed = parseWalletText(await f.text());
      let keys;
      if (parsed.encrypted) {
        for (;;) {
          const r = await dialog({
            title: 'This file is locked',
            message: `Passphrase for ${f.name}`,
            fields: [{ name: 'p', label: 'Passphrase', type: 'password' }],
            buttons: [{ label: 'Open', value: 'ok', primary: true }, { label: 'Cancel', value: 'no' }],
          });
          if (r.value !== 'ok') return;
          const busy = dialog({ title: 'Unlocking', message: 'Working…', buttons: [], bar: true });
          try { keys = keysFromWalletObject(await decryptWalletFile(parsed.enc, r.fields.p)); break; }
          catch (e) { busy.close(); await notice('Could not open', e.message); }
          finally { busy.close(); }
        }
      } else keys = parsed.keys;
      const wasEmpty = !state.keys.length;
      const added = addKeys(keys);
      if (wasEmpty) state.dirty = false;
      else if (added) state.dirty = true;
      select(wasEmpty ? 0 : state.keys.length - added);
      render();
      setStatus(`Opened ${f.name}: ${keys.length} wallet${keys.length === 1 ? '' : 's'}, ${added} new`);
      openWin('main');
    } catch (e) {
      await notice('Could not open', e.message);
    }
  });
  inp.click();
}

async function printWallets() {
  if (!state.keys.length) return;
  const r = await dialog({
    title: 'Print paper wallets',
    message: 'This prints the private key of every wallet, and printers can keep copies. Only use a printer you trust.',
    buttons: [{ label: 'Print', value: 'ok', primary: true }, { label: 'Cancel', value: 'no' }],
  });
  if (r.value !== 'ok') return;
  const root = $('#print');
  root.replaceChildren(el('div', { class: 'pw-head' }, `Keypool paper wallets - ${new Date().toLocaleDateString()} - keep private`));
  state.keys.forEach((k, i) => {
    const pub = el('div', {}, el('h4', {}, `#${i + 1}  ${TYPES[k.type].label}`), el('div', { class: 'tag' }, 'ADDRESS - share this'));
    const a = el('div'); a.innerHTML = qrSvg(k.address);
    pub.append(a, el('p', {}, k.address));
    const priv = el('div', {}, el('h4', {}, ' '), el('div', { class: 'tag priv' }, 'PRIVATE KEY - never share'));
    const s = el('div'); s.innerHTML = qrSvg(k.secret);
    priv.append(s, el('p', {}, k.secret));
    root.append(el('div', { class: 'pw' }, pub, priv));
  });
  window.print();
}
addEventListener('afterprint', () => $('#print').replaceChildren());

async function lock() {
  const r = await dialog({
    title: 'Lock and clear',
    message: state.dirty && state.keys.length
      ? 'Some wallets are NOT saved. They will be gone for good. Clear this page anyway?'
      : 'Remove all wallets from this page and start fresh? Your saved backup files are not touched.',
    buttons: [{ label: 'Clear', value: 'ok', primary: true }, { label: 'Cancel', value: 'no' }],
  });
  if (r.value !== 'ok') return;
  state.dirty = false;
  location.reload();
}

// ---------------------------------------------------------------- check / add a key
let found = [];
function checkImport() {
  found = keysFromSecret($('#im-text').value).filter((k) => k.type === 'sol');
  const out = $('#im-result');
  if (!$('#im-text').value.trim()) out.textContent = 'Nothing pasted yet.';
  else if (!found.length) out.textContent = 'That does not look like a Solana private key.';
  else out.textContent = found.map((k) => `This key belongs to the wallet address:\n${k.address}`).join('\n\n');
  out.style.whiteSpace = 'pre-wrap';
  $('#im-add').disabled = !found.length;
}
$('#im-text').addEventListener('input', checkImport);
$('#im-clear').addEventListener('click', () => { $('#im-text').value = ''; checkImport(); });
$('#im-add').addEventListener('click', () => {
  const n = addKeys(found);
  if (n) state.dirty = true;
  $('#im-text').value = '';
  checkImport();
  render();
  setStatus(n ? `Added ${n} wallet${n > 1 ? 's' : ''}. Save the backup file again.` : 'That wallet is already here');
  openWin('main');
});

const commands = {
  generate, save, lock,
  'open-file': openFile,
  print: printWallets,
  import: () => openWin('import'),
};
$('#b-generate').addEventListener('click', generate);
$('#b-open').addEventListener('click', openFile);
$('#b-save').addEventListener('click', save);
$('#b-print').addEventListener('click', printWallets);
$('#b-details').addEventListener('click', () => showKey(state.sel));

// ---------------------------------------------------------------- extras: entropy, balloon, clock, wallpaper
let tick = 0;
addEventListener('pointermove', (e) => {
  if (++tick % 3) return;
  entropy.add(`${e.clientX},${e.clientY},${e.timeStamp}`);
  if (entropy.samples % 8 === 0) $('#st-rand').textContent = `mouse samples: ${entropy.samples}`;
});
addEventListener('beforeunload', (e) => {
  if (state.dirty && state.keys.length) { e.preventDefault(); e.returnValue = ''; }
});

const balloon = $('#balloon');
function hideBalloon() {
  if (balloon.hidden) return;
  balloon.classList.add('closing');
  setTimeout(() => { balloon.hidden = true; balloon.classList.remove('closing'); }, 160);
}
$('.x', balloon).addEventListener('click', (e) => { e.stopPropagation(); hideBalloon(); });
balloon.addEventListener('click', () => { hideBalloon(); openWin('readme'); });

const clock = $('#clock');
const tickClock = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
tickClock();
setInterval(tickClock, 20000);

startDither($('#wall'), { palette: ['#006a6a', '#007b7b', '#0d9390'], cell: 3 });

openWin('readme');
openWin('main');
render();
setTimeout(() => { balloon.hidden = false; setTimeout(hideBalloon, 11000); }, 1400);
