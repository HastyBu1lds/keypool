// Docs page: the "Copy address" button. Nothing else runs here and nothing is sent anywhere.
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) {
      const t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      document.body.append(t);
      t.select();
      try { ok = document.execCommand('copy'); } catch {}
      t.remove();
    }
    btn.textContent = ok ? 'Copied' : 'Select it and press Ctrl+C';
    setTimeout(() => { btn.textContent = label; }, 2200);
  });
});
