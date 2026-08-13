// @vitest-environment node
import { createVerify, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createStorage } from '../lib/storage/factory';
import {
  GcsLogStorage,
  gcsAccessToken,
  gcsCanonicalQuery,
  gcsCanonicalRequest,
  gcsDatestamps,
  gcsErrorDetail,
  gcsResourcePath,
  gcsSignedUrl,
  gcsStringToSign,
} from '../lib/storage/gcs';
import { sha256Hex } from '../lib/storage/webcrypto';
import type { GcsConfig } from '../lib/storage/types';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const saKey = { client_email: 'reader@proj.iam.gserviceaccount.com', private_key: privateKey };
const cfg: GcsConfig = {
  gcsBucketName: 'my-logs',
  gcsServiceAccountKey: JSON.stringify(saKey),
};
const NOW = new Date('2026-07-04T01:02:03.000Z');
const key = (yyyymmdd: string) => `contentful-audit-org1-${yyyymmdd}T040000000Z.json`;

describe('V4 signing pieces (documented formats)', () => {
  it('datestamps', () => {
    expect(gcsDatestamps(NOW)).toEqual({ date: '20260704', timestamp: '20260704T010203Z' });
  });

  it('canonical query is alphabetical with encoded credential', () => {
    expect(gcsCanonicalQuery(saKey, NOW)).toBe(
      'X-Goog-Algorithm=GOOG4-RSA-SHA256' +
        '&X-Goog-Credential=reader%40proj.iam.gserviceaccount.com%2F20260704%2Fauto%2Fstorage%2Fgoog4_request' +
        '&X-Goog-Date=20260704T010203Z' +
        '&X-Goog-Expires=900' +
        '&X-Goog-SignedHeaders=host'
    );
  });

  it('canonical request has the documented 7 lines', () => {
    const cr = gcsCanonicalRequest('/my-logs/a%20b.json', 'Q=1');
    expect(cr).toBe(
      'GET\n/my-logs/a%20b.json\nQ=1\nhost:storage.googleapis.com\n\nhost\nUNSIGNED-PAYLOAD'
    );
  });

  it('string-to-sign has the documented 4 lines', () => {
    expect(gcsStringToSign('20260704T010203Z', '20260704', 'deadbeef')).toBe(
      'GOOG4-RSA-SHA256\n20260704T010203Z\n20260704/auto/storage/goog4_request\ndeadbeef'
    );
  });

  it('resource path encodes segments but keeps slashes', () => {
    expect(gcsResourcePath('b', 'audit/file name.json')).toBe('/b/audit/file%20name.json');
  });
});

describe('gcsSignedUrl', () => {
  it('produces a URL whose signature node:crypto verifies end-to-end', async () => {
    const url = new URL(await gcsSignedUrl(saKey, 'my-logs', 'x.json', NOW));
    const sigHex = url.searchParams.get('X-Goog-Signature')!;
    url.searchParams.delete('X-Goog-Signature');
    const canonicalQuery = url.search.slice(1);
    const { date, timestamp } = gcsDatestamps(NOW);
    const hash = await sha256Hex(gcsCanonicalRequest(url.pathname, canonicalQuery));
    const verify = createVerify('RSA-SHA256').update(
      gcsStringToSign(timestamp, date, hash),
      'utf8'
    );
    expect(verify.verify(publicKey, Buffer.from(sigHex, 'hex'))).toBe(true);
  });
});

describe('gcsAccessToken', () => {
  it('sends an RS256 JWT grant that node:crypto verifies, returns the token', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ access_token: 'tok' }) });
    const token = await gcsAccessToken(saKey, fetchFn as unknown as typeof fetch, NOW);
    expect(token).toBe('tok');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const assertion = new URLSearchParams(init.body).get('assertion')!;
    const [h, c, s] = assertion.split('.');
    const fromUrl = (x: string) => Buffer.from(x.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    expect(JSON.parse(fromUrl(h).toString())).toEqual({ alg: 'RS256', typ: 'JWT' });
    const claims = JSON.parse(fromUrl(c).toString());
    expect(claims.iss).toBe(saKey.client_email);
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token');
    expect(claims.exp - claims.iat).toBe(3600);
    const verify = createVerify('RSA-SHA256').update(`${h}.${c}`, 'utf8');
    expect(verify.verify(publicKey, fromUrl(s))).toBe(true);
  });

  it('throws cleanly on exchange failure', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(gcsAccessToken(saKey, fetchFn as unknown as typeof fetch, NOW)).rejects.toThrow(
      'GCS token exchange failed: HTTP 401'
    );
  });

  it('appends the upstream error_description when the token endpoint returns one', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: 'invalid_grant' }),
      json: async () => ({ error_description: 'invalid_grant' }),
    });
    await expect(gcsAccessToken(saKey, fetchFn as unknown as typeof fetch, NOW)).rejects.toThrow(
      'GCS token exchange failed: HTTP 400 — invalid_grant'
    );
  });
});

describe('GcsLogStorage.listLogFiles', () => {
  const now = () => NOW;

  it('exchanges a token, paginates the JSON API, returns signed URLs', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ name: key('20260603'), size: '10' }], nextPageToken: 'P2' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { name: key('20260605'), size: '20' },
            { name: 'noise.txt', size: '1' },
          ],
        }),
      });
    const storage = new GcsLogStorage(cfg, { fetchFn: fetchFn as unknown as typeof fetch, now });
    const { files, truncated } = await storage.listLogFiles('2026-06-01', '2026-06-10');

    const listUrl1: string = fetchFn.mock.calls[1][0];
    expect(listUrl1).toContain('https://storage.googleapis.com/storage/v1/b/my-logs/o?');
    expect(listUrl1).toContain(`prefix=${encodeURIComponent('contentful-audit-')}`);
    expect(fetchFn.mock.calls[1][1].headers.Authorization).toBe('Bearer tok');
    expect(fetchFn.mock.calls[2][0]).toContain('pageToken=P2');

    expect(truncated).toBe(false);
    expect(files.map((f) => f.coveredDate)).toEqual(['2026-06-04', '2026-06-02']);
    for (const f of files) {
      expect(f.url).toContain(`https://storage.googleapis.com/my-logs/${f.key}?`);
      expect(f.url).toContain('X-Goog-Signature=');
    }
    expect(files[0].size).toBe(20); // numeric coercion of the JSON API's string sizes
  });

  it('throws a clean error on list failure', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    await expect(
      new GcsLogStorage(cfg, { fetchFn: fetchFn as unknown as typeof fetch, now }).listLogFiles(
        '2026-06-01',
        '2026-06-10'
      )
    ).rejects.toThrow('GCS list failed: HTTP 403');
  });

  it('appends the upstream error.message when the list API returns one', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: { message: 'Invalid Credentials' } }),
        json: async () => ({ error: { message: 'Invalid Credentials' } }),
      });
    await expect(
      new GcsLogStorage(cfg, { fetchFn: fetchFn as unknown as typeof fetch, now }).listLogFiles(
        '2026-06-01',
        '2026-06-10'
      )
    ).rejects.toThrow('GCS list failed: HTTP 403 — Invalid Credentials');
  });
});

describe('factory', () => {
  it('routes provider=gcs to GcsLogStorage', () => {
    expect(createStorage({ provider: 'gcs', ...cfg })).toBeInstanceOf(GcsLogStorage);
  });
});

describe('gcsErrorDetail', () => {
  it('returns "" for an empty, absent, or unparseable body', () => {
    expect(gcsErrorDetail('')).toBe('');
    expect(gcsErrorDetail(undefined)).toBe('');
    expect(gcsErrorDetail({})).toBe('');
    expect(gcsErrorDetail('not json')).toBe('');
  });

  it('extracts error.message from the JSON API shape', () => {
    expect(gcsErrorDetail({ error: { message: 'Invalid Credentials' } })).toBe(
      'Invalid Credentials'
    );
  });

  it('extracts error_description from the OAuth token endpoint shape', () => {
    expect(gcsErrorDetail({ error_description: 'invalid_grant' })).toBe('invalid_grant');
  });

  it('caps the extract at 200 characters', () => {
    const long = 'x'.repeat(500);
    expect(gcsErrorDetail({ error: { message: long } }).length).toBeLessThanOrEqual(200);
  });
});
