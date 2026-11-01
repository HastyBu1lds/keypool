import {
  Entropy, newKey, keysFromSecret, solanaJsonArray,
  buildWalletFile, encryptWalletFile, decryptWalletFile, parseWalletText, keysFromWalletObject,
} from '../src/core.js';
import { decryptText, cancelDecrypt } from '../src/decrypt.js';
import { qrSvg } from '../src/qr.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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

// ---------------------------------------------------------------- parts
// Odometer digit (idea from React Bits "Counter"): a strip of 0-9 that rolls to the new digit.
function odometer(root, value, from) {
  const digits = String(value).split('');
  const strips = digits.map(() => {
    const d = el('span', { class: 'od-d' }, el('span', { class: 'od-size' }, '0'));
    const strip = el('span', { class: 'od-strip still' });
    for (let i = 0; i < 10; i++) strip.append(el('span', { class: 'od-n' }, String(i)));
    d.append(strip);
    return { d, strip };
  });
  root.replaceChildren(el('span', { class: 'od', 'aria-hidden': 'true' }, ...strips.map((s) => s.d)));
  const put = (v) => String(v).split('').forEach((ch, i) => { strips[i].strip.style.transform = `translateY(${-(+ch) * 10}%)`; });
  put(from ?? value);
  if (from != null && !reduced) {
    void root.offsetWidth;
    strips.forEach((s) => s.strip.classList.remove('still'));
    setTimeout(() => put(value), 650);
  } else {
    put(value);
    requestAnimationFrame(() => strips.forEach((s) => s.strip.classList.remove('still')));
  }
}

// Number ticker (idea from Magic UI "Number Ticker"): a spring that counts to the new number.
function ticker(node) {
  let x = +node.textContent || 0, v = 0, target = x, raf = 0, last = 0;
  const step = (t) => {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    v += (-100 * (x - target) - 18 * v) * dt;
    x += v * dt;
    if (Math.abs(x - target) < 0.4 && Math.abs(v) < 2) { x = target; node.textContent = String(target); raf = 0; return; }
    node.textContent = String(Math.round(x));
    raf = requestAnimationFrame(step);
  };
  return (n) => {
    target = n;
    if (reduced) { node.textContent = String(n); x = n; return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  };
}

// Line reveal (idea from React Bits "SplitText"): each word slides up out of a mask.
function revealWords(node) {
  const text = node.textContent;
  node.setAttribute('aria-label', text);
  node.replaceChildren(...text.split(' ').flatMap((word, i) => [
    el('span', { class: 'w', 'aria-hidden': 'true' }, el('span', { class: 'wi' }, word)),
    document.createTextNode(' '),
  ].map((n, j) => { if (j === 0) n.firstChild.style.setProperty('--i', String(i)); return n; })));
  requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('in')));
}

// ---------------------------------------------------------------- toast + dialog
const toast = $('#toast');
let toastTimer = 0;
function say(text, ms = 6000) {
  $('#toast-t').textContent = text;
  toast.classList.remove('closing');
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms);
}
function hideToast() {
  if (toast.hidden) return;
  toast.classList.add('closing');
  setTimeout(() => { toast.hidden = true; toast.classList.remove('closing'); }, 220);
}
$('#toast-x').addEventListener('click', hideToast);

const dlg = $('#dlg');
function dialog({ title = 'Keypool', message = '', fields = [], buttons = [{ label: 'OK', value: 'ok', primary: true }], validate, bar = false }) {
  let done;
  const p = new Promise((r) => (done = r));
  $('#d-title').textContent = title;
  $('#d-msg').textContent = message;
  const fe = $('#d-fields');
  fe.replaceChildren();
  const err = el('p', { class: 'err', role: 'alert' });
  fields.forEach((f) => fe.append(el('label', { class: 'fld dlg' }, f.label, el('input', { name: f.name, type: f.type || 'text', autocomplete: 'off' }))));
  fe.append(err);
  $('#d-bar').hidden = !bar;
  const be = $('#d-buttons');
  be.replaceChildren();
  const cancel = buttons.find((b) => !b.primary && b.value === 'no');
  const read = () => Object.fromEntries(fields.map((f) => [f.name, $(`[name="${f.name}"]`, fe).value]));
  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    $('#d-form').onsubmit = null;
    dlg.oncancel = null;
    if (dlg.open) dlg.close();
  };
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
    const btn = el('button', { class: 'btn' + (b.primary ? '' : ' ghost'), type: b.primary ? 'submit' : 'button' }, b.label);
    if (!b.primary) btn.addEventListener('click', () => finish(b.value, false));
    be.append(btn);
  });
  const primary = buttons.find((b) => b.primary);
  $('#d-form').onsubmit = (e) => { e.preventDefault(); if (primary) finish(primary.value, true); };
  dlg.oncancel = (e) => { e.preventDefault(); if (cancel) finish(cancel.value, false); };
  if (!dlg.open) dlg.showModal();
  (fe.querySelector('input') || be.querySelector('button'))?.focus();
  p.close = cleanup;
  return p;
}
const notice = (title, message) => dialog({ title, message });

// ---------------------------------------------------------------- helpers
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

// ---------------------------------------------------------------- wallet list
const setCount = ticker($('#n-wallets'));
function render() {
  const rows = $('#rows');
  rows.replaceChildren();
  state.keys.forEach((k, i) => {
    const tr = el('tr', { tabIndex: 0, class: i === state.sel ? 'sel' : '' }, el('td', {}, String(i + 1)), el('td', { title: k.address }, k.address));
    tr.addEventListener('click', () => showKey(i));
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showKey(i); }
      if (e.key === 'ArrowDown') { e.preventDefault(); rows.children[i + 1]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); rows.children[i - 1]?.focus(); }
    });
    rows.append(tr);
  });
  const n = state.keys.length;
  $('#empty').hidden = n > 0;
  setCount(n);
  const ps = $('#pool-state');
  ps.textContent = n ? (state.dirty ? 'Not saved yet' : 'Saved') : '';
  ps.classList.toggle('warn', !!(state.dirty && n));
  ['#b-save', '#b-print', '#b-lock'].forEach((s) => ($(s).disabled = !n));
  const now = !n ? 1 : state.dirty ? 2 : 3;
  $$('#steps li').forEach((li) => {
    const s = +li.dataset.step;
    li.classList.toggle('now', s === now);
    li.classList.toggle('done', s < now);
  });
  document.title = state.dirty && n ? 'Not saved - Keypool' : 'Keypool - one secret, not two';
}
function addKeys(list) {
  const have = new Set(state.keys.map((k) => k.address));
  let added = 0;
  for (const k of list) if (!have.has(k.address)) { state.keys.push(k); have.add(k.address); added++; }
  return added;
}

// ---------------------------------------------------------------- wallet details
let shown = null;
let revealed = false;
function showKey(i) {
  const k = state.keys[i];
  if (!k) return;
  state.sel = i;
  $$('#rows tr').forEach((tr, j) => tr.classList.toggle('sel', j === i));
  hideSecret(true);
  shown = k;
  $('#detail-empty').hidden = true;
  $('#detail-body').hidden = false;
  $('#k-addr').textContent = k.address;
  $('#k-qr').innerHTML = qrSvg(k.address, { label: 'QR code of the address' });
  $('#k-explorer').href = `https://solscan.io/account/${k.address}`;
  $('#k-explorer').title = 'Opens Solscan in a new tab. This tells that site the address.';
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
const copyBtn = (id, get, ok) => $(id).addEventListener('click', async () => {
  if (shown) $('#st-key').textContent = (await copy(get())) ? ok : 'Could not copy. Select it and press Ctrl+C.';
});
copyBtn('#k-copy-addr', () => shown.address, 'Address copied');
copyBtn('#k-copy-secret', () => shown.secret, 'Private key copied. Clipboards can be read by other apps.');
copyBtn('#k-copy-json', () => solanaJsonArray(shown.secret), 'keypair.json list copied. Clipboards can be read by other apps.');

// ---------------------------------------------------------------- make / save / open
function generate() {
  const n = +($('input[name="count"]:checked')?.value || 1);
  const before = state.keys.length;
  const list = [];
  for (let i = 0; i < n; i++) list.push(newKey('sol', entropy));
  addKeys(list);
  state.dirty = true;
  render();
  showKey(before);
  $('#rows').children[before]?.scrollIntoView({ block: 'nearest' });
  say(`Made ${n} wallet${n > 1 ? 's' : ''}. Next: press Save backup file.`);
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
      render();
      showKey(wasEmpty ? 0 : state.keys.length - added);
      say(`Opened ${f.name}: ${keys.length} wallet${keys.length === 1 ? '' : 's'}, ${added} new`);
      $('#make').scrollIntoView();
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
    const pub = el('div', {}, el('h4', {}, `#${i + 1}  Solana`), el('div', { class: 'tag' }, 'ADDRESS - share this'));
    const a = el('div'); a.innerHTML = qrSvg(k.address);
    pub.append(a, el('p', {}, k.address));
    const priv = el('div', {}, el('h4', {}, ' '), el('div', { class: 'tag priv' }, 'PRIVATE KEY - never share'));
    const s = el('div'); s.innerHTML = qrSvg(k.secret);
    priv.append(s, el('p', {}, k.secret));
    root.append(el('div', { class: 'pw' }, pub, priv));
  });
  window.print();
}
addEventListener('afterprint', () => $('#print').replaceChildren());

async function lock() {
  const r = await dialog({
    title: 'Clear this page',
    message: state.dirty && state.keys.length
      ? 'Some wallets are NOT saved. They will be gone for good. Clear this page anyway?'
      : 'Remove all wallets from this page and start fresh? Your saved backup files are not touched.',
    buttons: [{ label: 'Clear', value: 'ok', primary: true }, { label: 'Cancel', value: 'no' }],
  });
  if (r.value !== 'ok') return;
  state.dirty = false;
  location.reload();
}

// ---------------------------------------------------------------- check a key
let found = [];
function checkImport() {
  found = keysFromSecret($('#im-text').value).filter((k) => k.type === 'sol');
  const out = $('#im-result');
  if (!$('#im-text').value.trim()) out.textContent = 'Nothing pasted yet.';
  else if (!found.length) out.textContent = 'That does not look like a Solana private key.';
  else out.textContent = found.map((k) => `This key belongs to the wallet address:\n${k.address}`).join('\n\n');
  $('#im-add').disabled = !found.length;
}
$('#im-text').addEventListener('input', checkImport);
$('#im-clear').addEventListener('click', () => { $('#im-text').value = ''; checkImport(); });
$('#im-add').addEventListener('click', () => {
  const before = state.keys.length;
  const n = addKeys(found);
  if (n) state.dirty = true;
  $('#im-text').value = '';
  checkImport();
  render();
  if (n) showKey(before);
  say(n ? `Added ${n} wallet${n > 1 ? 's' : ''}. Save the backup file again.` : 'That wallet is already here');
  $('#make').scrollIntoView();
});

$('#b-generate').addEventListener('click', generate);
$('#b-open').addEventListener('click', openFile);
$('#b-save').addEventListener('click', save);
$('#b-print').addEventListener('click', printWallets);
$('#b-lock').addEventListener('click', lock);

// ---------------------------------------------------------------- extras
let tick = 0;
addEventListener('pointermove', (e) => {
  if (++tick % 3) return;
  entropy.add(`${e.clientX},${e.clientY},${e.timeStamp}`);
  if (entropy.samples % 8 === 0) $('#st-rand').textContent = `mouse samples: ${entropy.samples}`;
});
addEventListener('beforeunload', (e) => {
  if (state.dirty && state.keys.length) { e.preventDefault(); e.returnValue = ''; }
});

odometer($('#hero-num'), 1, 2);
revealWords($('#h1'));
render();
