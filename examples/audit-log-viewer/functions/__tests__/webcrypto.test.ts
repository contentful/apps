// @vitest-environment node
import { createHmac, createVerify, generateKeyPairSync, createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  base64Decode,
  base64Encode,
  base64UrlEncode,
  hmacSha256,
  pemToPkcs8Bytes,
  rsaSha256Sign,
  sha256Hex,
} from '../lib/storage/webcrypto';

describe('base64 helpers', () => {
  it('round-trips bytes', () => {
    const bytes = new Uint8Array([0, 1, 254, 255, 100]);
    expect(base64Decode(base64Encode(bytes))).toEqual(bytes);
  });

  it('base64url uses -_ and strips padding', () => {
    // 0xfb 0xff encodes to "+/8=" in standard base64
    expect(base64UrlEncode(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
  });
});

describe('hmacSha256', () => {
  it('matches node:crypto for the same key and message', async () => {
    const keyBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const message = 'r\n\n2026-07-04T00:00:00Z\n/blob/acct/container/file.json\n\n\nhttps\n2022-11-02\nb\n\n\n\n\n\n\n';
    const ours = await hmacSha256(keyBytes, message);
    const expected = createHmac('sha256', Buffer.from(keyBytes)).update(message, 'utf8').digest();
    expect(Buffer.from(ours).equals(expected)).toBe(true);
  });
});

describe('rsaSha256Sign', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  it('produces a signature node:crypto verifies (RSASSA-PKCS1-v1_5)', async () => {
    const message = 'GOOG4-RSA-SHA256\n20260704T000000Z\n20260704/auto/storage/goog4_request\nabc';
    const sig = await rsaSha256Sign(privateKey, message);
    const verify = createVerify('RSA-SHA256').update(message, 'utf8');
    expect(verify.verify(publicKey, Buffer.from(sig))).toBe(true);
  });

  it('pemToPkcs8Bytes matches node DER output', () => {
    const der = pemToPkcs8Bytes(privateKey);
    const body = privateKey
      .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    expect(Buffer.from(der).equals(Buffer.from(body, 'base64'))).toBe(true);
  });
});

describe('sha256Hex', () => {
  it('matches node:crypto', async () => {
    expect(await sha256Hex('hello')).toBe(createHash('sha256').update('hello').digest('hex'));
  });
});
