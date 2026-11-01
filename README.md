# Keypool

Make Solana wallets with **no seed phrase**. Each wallet is one random private key, saved in a backup file, the way Bitcoin's first wallets worked. It runs entirely in your browser: **https://keypool.fun**

Docs, with ways to check every claim yourself: **https://keypool.fun/docs.html**

> **Status: not audited.** No independent security review has been done. Try a small amount first, send it out again, and only then use more. Lose every copy of your backup file (and any passphrase) and the coins are gone.

## What it does

- Makes random Solana (Ed25519) keys in the page. No seed phrase, no master key, no account.
- Saves them in a JSON backup file, optionally locked with a passphrase (scrypt + AES-256-GCM).
- Opens a saved file and re-derives every address from its secret, refusing files that do not match.
- Checks a pasted private key and shows its address.
- Prints paper wallets (after a confirmation, since printers keep copies).
- Saves a single wallet on its own, so a leaked file can expose one wallet instead of all of them.

## How keys are made

1. 32 bytes from the browser's secure random generator (`crypto.getRandomValues`).
2. Hashed with SHA-256 together with a pool of mouse-movement samples and a counter. The mouse samples can only add randomness, never remove it.
3. The result is an Ed25519 seed. The address is the base58 public key. The private key you can copy is `seed || public key` in base58, which Phantom, Solflare and Backpack accept under "Import private key".

The code for this is in [`src/core.js`](src/core.js). The backup file format and the passphrase lock are described in [`docs.html`](public-drop/docs.html).

## Nothing leaves your browser

The page ships a Content Security Policy with `connect-src 'none'`, so the browser itself refuses any network request from the page. The policy is in `public-drop/index.html` (meta tag) and `public-drop/_headers`. The site has no analytics, no third-party scripts, and its fonts and script are served from the same origin. The code does not use `localStorage`, cookies or any network API.

To check it yourself: watch the Network tab while you make wallets, run `fetch('https://example.com')` in the console and see the policy block it, or save the page and use it with the internet off.

## Read the source

| Path | What it is |
|---|---|
| `src/core.js` | Key generation, wallet file format, passphrase encryption |
| `src/qr.js`, `src/decrypt.js` | QR codes and the private-key reveal effect |
| `src-drop/app.js` | The page's logic (the site you see) |
| `public-drop/` | The shipped site: HTML, CSS, `_headers`, and the built `app.js` |
| `test/core.test.mjs` | Tests: Ed25519 against the RFC 8032 vector, key uniqueness, file round trips |

`public-drop/app.js` is a minified bundle of the files in `src/` and `src-drop/`, built with esbuild. The test file uses well-known public test vectors (for example Bitcoin private key `1`); never send funds to those keys.

`public/` and `public-swiss/` are two earlier looks for the same tool, kept for reference. `logo/` has the logo drawings and the script that makes them.

## Build and test

    npm ci
    npm run build    # bundles src-drop/app.js into public-drop/app.js and copies the fonts
    npm test         # runs the 5 tests

Netlify settings are in `netlify.toml` (publish `public-drop`, Node 22, plus a proxy rule that serves `/ipfs/*` from an IPFS gateway).

## Credits

Cryptography: [@noble/curves](https://github.com/paulmillr/noble-curves), [@noble/hashes](https://github.com/paulmillr/noble-hashes), [@scure/base](https://github.com/paulmillr/scure-base) (all MIT). QR codes: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT). Fonts (self-hosted): Gabarito and Be Vietnam Pro, both under the SIL Open Font License.

The site's effects are plain-JavaScript rewrites of ideas from Magic UI (Ripple, Ripple Button, Number Ticker), React Bits (BlurText), Uiverse (a glass card by G4b413l, a spinner by mrhyddenn) and Opensource UI (toast banner).

## Licence

MIT. See [LICENSE](LICENSE). The software is provided as is, with no warranty: it is not audited, so use it at your own risk.
