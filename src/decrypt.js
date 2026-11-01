// Scramble-then-resolve text. Vanilla port of React Bits "DecryptedText" (reactbits.dev, MIT + Commons Clause),
// reduced to the sequential left-to-right reveal. The real text is never hidden from assistive tech or copy:
// it is set as the element's aria-label, and the final text is plain text in the DOM.

const GLYPHS = '0123456789abcdefABCDEFGHJKLMNPQRSTUVWXYZ#$%&*+=?';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const timers = new WeakMap();

export function decryptText(el, text, { speed = 24, lead = 10 } = {}) {
  cancelDecrypt(el);
  el.setAttribute('aria-label', text);
  if (reduced()) {
    el.textContent = text;
    return Promise.resolve();
  }
  const chars = Array.from(text);
  let shown = 0;
  return new Promise((resolve) => {
    const id = setInterval(() => {
      shown = Math.min(chars.length, shown + Math.max(1, Math.ceil(chars.length / 70)));
      let out = chars.slice(0, shown).join('');
      for (let i = shown; i < Math.min(chars.length, shown + lead); i++) {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (shown >= chars.length) {
        clearInterval(id);
        timers.delete(el);
        el.textContent = text;
        resolve();
      }
    }, speed);
    timers.set(el, id);
  });
}

export function cancelDecrypt(el) {
  const id = timers.get(el);
  if (id) clearInterval(id);
  timers.delete(el);
}
