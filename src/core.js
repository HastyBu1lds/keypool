// Keypool core: random keys, no seed phrase, wallet file with optional passphrase.
// Everything here runs in the page. Nothing is sent anywhere.
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { scryptAsync } from '@noble/hashes/scrypt';
import { concatBytes, utf8ToBytes, bytesToHex } from '@noble/hashes/utils';
import { createBase58check, base58, bech32, base64 } from '@scure/base';

const b58check = createBase58check(sha256);
const hash160 = (b) => ripemd160(sha256(b));

export const TYPES = {
  'btc-legacy': { chain: 'btc', short: 'Bitcoin 1…', label: 'Bitcoin, classic 1… address', compressed: true, kind: 'p2pkh' },
  'btc-2009': { chain: 'btc', short: 'Bitcoin 1… (2009)', label: 'Bitcoin, 2009 style (uncompressed key)', compressed: false, kind: 'p2pkh' },
  'btc-segwit': { chain: 'btc', short: 'Bitcoin bc1…', label: 'Bitcoin, native SegWit bc1… address', compressed: true, kind: 'p2wpkh' },
  sol: { chain: 'sol', short: 'Solana', label: 'Solana', kind: 'ed25519' },
};

const FORMAT = 'keypool-1';
const FORMAT_ENC = 'keypool-1-encrypted';
const SCRYPT_N = 2 ** 16;

// ---------- randomness ----------
// The browser's CSPRNG is always the base. Mouse movement is hashed in on top, so it can only add, never subtract.
export class Entropy {
  constructor() {
    this.pool = new Uint8Array(32);
    this.samples = 0;
    this.counter = 0;
  }
  add(n) {
    this.pool = sha256(concatBytes(this.pool, utf8ToBytes(String(n))));
    this.samples++;
  }
  bytes32() {
    const os = crypto.getRandomValues(new Uint8Array(32));
    return sha256(concatBytes(os, this.pool, utf8ToBytes(String(this.counter++))));
  }
}

// ---------- key construction ----------
export function keyFromBytes(type, bytes32) {
  const t = TYPES[type];
  if (!t) throw new Error('Unknown key type');
  if (t.chain === 'btc') {
    if (!secp256k1.utils.isValidPrivateKey(bytes32)) throw new Error('Not a valid private key');
    return fromBtcPrivate(type, bytes32);
  }
  return fromSolSeed(bytes32);
}

export function newKey(type, entropy) {
  for (;;) {
    const b = entropy.bytes32();
    if (TYPES[type].chain === 'btc' && !secp256k1.utils.isValidPrivateKey(b)) continue; // odds ~ 2^-128
    return keyFromBytes(type, b);
  }
}

function fromBtcPrivate(type, priv) {
  const t = TYPES[type];
  const pub = secp256k1.getPublicKey(priv, t.compressed);
  const h = hash160(pub);
  const address =
    t.kind === 'p2wpkh'
      ? bech32.encode('bc', [0, ...bech32.toWords(h)])
      : b58check.encode(concatBytes(Uint8Array.of(0x00), h));
  const wif = b58check.encode(concatBytes(Uint8Array.of(0x80), priv, t.compressed ? Uint8Array.of(1) : new Uint8Array(0)));
  return { type, address, secret: wif, publicKey: bytesToHex(pub) };
}

function fromSolSeed(seed) {
  const pub = ed25519.getPublicKey(seed);
  return {
    type: 'sol',
    address: base58.encode(pub),
    secret: base58.encode(concatBytes(seed, pub)),
    publicKey: bytesToHex(pub),
  };
}

// Turn a secret someone pasted in into key entries. Returns [] if it is not a key we know.
export function keysFromSecret(text) {
  const s = String(text).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.length === 64 && arr.every((n) => Number.isInteger(n) && n >= 0 && n < 256)) {
        return [solFromSecretBytes(Uint8Array.from(arr))];
      }
    } catch {}
    return [];
  }
  try {
    const d = b58check.decode(s);
    if (d[0] === 0x80 && (d.length === 33 || d.length === 34)) {
      const priv = d.slice(1, 33);
      if (!secp256k1.utils.isValidPrivateKey(priv)) return [];
      if (d.length === 33) return [fromBtcPrivate('btc-2009', priv)];
      if (d[33] !== 1) return [];
      return [fromBtcPrivate('btc-legacy', priv), fromBtcPrivate('btc-segwit', priv)];
    }
  } catch {}
  try {
    const d = base58.decode(s);
    if (d.length === 64 || d.length === 32) return [solFromSecretBytes(d)];
  } catch {}
  return [];
}

function solFromSecretBytes(d) {
  const key = fromSolSeed(d.slice(0, 32));
  if (d.length === 64 && bytesToHex(d.slice(32)) !== key.publicKey) throw new Error('Solana key is inconsistent');
  return key;
}

// Solana CLI / Phantom "keypair.json" format
export function solanaJsonArray(secretBase58) {
  return JSON.stringify(Array.from(base58.decode(secretBase58)));
}

// ---------- wallet file ----------
export function buildWalletFile(keys) {
  return {
    format: FORMAT,
    created: new Date().toISOString(),
    note: 'Random keys, no seed phrase. This file is the only backup. Keep copies.',
    keys: keys.map((k) => ({ type: k.type, address: k.address, secret: k.secret })),
  };
}

export async function encryptWalletFile(obj, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, SCRYPT_N, 8, 1, ['encrypt']);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8ToBytes(FORMAT_ENC) },
    key,
    utf8ToBytes(JSON.stringify(obj)),
  );
  return {
    format: FORMAT_ENC,
    kdf: 'scrypt', N: SCRYPT_N, r: 8, p: 1,
    cipher: 'aes-256-gcm',
    salt: base64.encode(salt),
    iv: base64.encode(iv),
    data: base64.encode(new Uint8Array(ct)),
  };
}

export async function decryptWalletFile(enc, passphrase) {
  if (enc.kdf !== 'scrypt' || enc.cipher !== 'aes-256-gcm') throw new Error('Unsupported file');
  if (!(enc.N <= 2 ** 20 && enc.N >= 2 ** 10) || !(enc.r >= 1 && enc.r <= 16) || !(enc.p >= 1 && enc.p <= 4)) {
    throw new Error('Unsupported file settings');
  }
  const key = await deriveKey(passphrase, base64.decode(enc.salt), enc.N, enc.r, enc.p, ['decrypt']);
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64.decode(enc.iv), additionalData: utf8ToBytes(FORMAT_ENC) },
      key,
      base64.decode(enc.data),
    );
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    throw new Error('Wrong passphrase, or the file is damaged');
  }
}

async function deriveKey(passphrase, salt, N, r, p, usage) {
  const raw = await scryptAsync(utf8ToBytes(passphrase.normalize('NFKC')), salt, { N, r, p, dkLen: 32, asyncTick: 25 });
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, usage);
}

// Read text from a file the user picked. Returns { encrypted, enc } or { keys }.
export function parseWalletText(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('This is not a Keypool wallet file');
  }
  if (obj && obj.format === FORMAT_ENC) return { encrypted: true, enc: obj };
  return { encrypted: false, keys: keysFromWalletObject(obj) };
}

// Re-derive every address from its secret. A file whose addresses do not match is refused.
export function keysFromWalletObject(obj) {
  if (!obj || obj.format !== FORMAT || !Array.isArray(obj.keys)) throw new Error('This is not a Keypool wallet file');
  return obj.keys.map((k, i) => {
    const found = keysFromSecret(k.secret).find((x) => x.type === k.type);
    if (!found) throw new Error(`Key ${i + 1} could not be read`);
    if (found.address !== k.address) throw new Error(`Key ${i + 1}: address does not match its secret`);
    return found;
  });
}
