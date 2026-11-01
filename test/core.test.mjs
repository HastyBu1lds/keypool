import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToBytes } from '@noble/hashes/utils';
import {
  Entropy, TYPES, keyFromBytes, newKey, keysFromSecret, solanaJsonArray,
  buildWalletFile, encryptWalletFile, decryptWalletFile, parseWalletText, keysFromWalletObject,
} from '../src/core.js';

const ONE = hexToBytes('00'.repeat(31) + '01');

test('bitcoin vectors for private key 1', () => {
  const c = keyFromBytes('btc-legacy', ONE);
  assert.equal(c.address, '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
  assert.equal(c.secret, 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn');
  const u = keyFromBytes('btc-2009', ONE);
  assert.equal(u.address, '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm');
  assert.equal(u.secret, '5HpHagT65TZzG1PH3CSu63k8DbpvD8s5ip4nEB3kEsreAnchuDf');
  const s = keyFromBytes('btc-segwit', ONE);
  assert.equal(s.address, 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
});

test('solana: RFC 8032 vector and secret round trip', () => {
  const seed = hexToBytes('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60');
  const k = keyFromBytes('sol', seed);
  assert.equal(k.publicKey, 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
  const back = keysFromSecret(k.secret);
  assert.equal(back.length, 1);
  assert.equal(back[0].address, k.address);
  const fromJson = keysFromSecret(solanaJsonArray(k.secret));
  assert.equal(fromJson[0].address, k.address);
});

test('importing a WIF gives back the same addresses', () => {
  const [a, b] = keysFromSecret('KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn');
  assert.equal(a.address, '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
  assert.equal(b.address, 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
  assert.equal(keysFromSecret('5HpHagT65TZzG1PH3CSu63k8DbpvD8s5ip4nEB3kEsreAnchuDf')[0].type, 'btc-2009');
  assert.deepEqual(keysFromSecret('hello'), []);
  // one character changed -> checksum fails -> not a key
  assert.deepEqual(keysFromSecret('KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWm'), []);
});

test('generated keys are unique, valid and re-importable (all types)', () => {
  const e = new Entropy();
  e.add('12,34,5');
  const seen = new Set();
  for (const type of Object.keys(TYPES)) {
    for (let i = 0; i < 25; i++) {
      const k = newKey(type, e);
      assert.ok(!seen.has(k.address));
      seen.add(k.address);
      assert.ok(keysFromSecret(k.secret).some((x) => x.address === k.address && x.type === type));
    }
  }
});

test('wallet file: plain and encrypted round trip, tamper checks', async () => {
  const e = new Entropy();
  const keys = [newKey('btc-legacy', e), newKey('btc-segwit', e), newKey('sol', e)];
  const file = buildWalletFile(keys);
  const plain = parseWalletText(JSON.stringify(file));
  assert.equal(plain.encrypted, false);
  assert.deepEqual(plain.keys.map((k) => k.address), keys.map((k) => k.address));

  const enc = await encryptWalletFile(file, 'correct horse battery staple');
  assert.equal(enc.format, 'keypool-1-encrypted');
  assert.ok(!JSON.stringify(enc).includes(keys[0].secret));
  const parsed = parseWalletText(JSON.stringify(enc));
  assert.equal(parsed.encrypted, true);
  const back = await decryptWalletFile(parsed.enc, 'correct horse battery staple');
  assert.deepEqual(keysFromWalletObject(back).map((k) => k.address), keys.map((k) => k.address));
  await assert.rejects(decryptWalletFile(parsed.enc, 'wrong'), /Wrong passphrase/);

  const bad = JSON.parse(JSON.stringify(file));
  bad.keys[0].address = keys[1].address;
  assert.throws(() => keysFromWalletObject(bad), /does not match/);
  assert.throws(() => parseWalletText('not json'), /not a Keypool/);
});
