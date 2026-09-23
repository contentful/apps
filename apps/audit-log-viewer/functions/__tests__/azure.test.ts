// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  AZURE_SAS_VERSION,
  AzureLogStorage,
  azureErrorDetail,
  azureMintSas,
  azureSasStringToSign,
} from '../lib/storage/azure';
import { createStorage } from '../lib/storage/factory';
import type { AzureConfig } from '../lib/storage/types';

const cfg: AzureConfig = {
  azureAccountName: 'acct',
  azureContainerName: 'logs',
  azureAccountKey: Buffer.from('super-secret-account-key').toString('base64'),
};

const key = (yyyymmdd: string) => `contentful-audit-org1-${yyyymmdd}T040000000Z.json`;

// Real Azure responses carry a leading UTF-8 BOM — reproduce it in the fakes.
const listXml = (names: string[], nextMarker = '') => `\uFEFF<?xml version="1.0" encoding="utf-8"?>
<EnumerationResults ServiceEndpoint="https://acct.blob.core.windows.net/" ContainerName="logs">
  <Blobs>${names
    .map(
      (n) =>
        `<Blob><Name>${n}</Name><Properties><Content-Length>42</Content-Length></Properties></Blob>`
    )
    .join('')}</Blobs>
  <NextMarker>${nextMarker}</NextMarker>
</EnumerationResults>`;

describe('azureSasStringToSign', () => {
  it('produces the documented 16-field service-SAS string', () => {
    const s = azureSasStringToSign({
      permissions: 'r',
      resource: 'b',
      canonicalizedResource: '/blob/acct/logs/file.json',
      expiryIso: '2026-07-04T00:15:00Z',
    });
    expect(s).toBe(
      'r\n\n2026-07-04T00:15:00Z\n/blob/acct/logs/file.json\n\n\nhttps\n' +
        AZURE_SAS_VERSION +
        '\nb\n\n\n\n\n\n\n'
    );
    expect(s.split('\n')).toHaveLength(16);
  });
});

describe('azureMintSas', () => {
  it('signs with HMAC-SHA256 of the base64-decoded key (verified via node:crypto)', async () => {
    const input = {
      permissions: 'l' as const,
      resource: 'c' as const,
      canonicalizedResource: '/blob/acct/logs',
      expiryIso: '2026-07-04T00:15:00Z',
    };
    const sas = new URLSearchParams(await azureMintSas(cfg.azureAccountKey, input));
    expect(sas.get('sv')).toBe(AZURE_SAS_VERSION);
    expect(sas.get('sp')).toBe('l');
    expect(sas.get('sr')).toBe('c');
    expect(sas.get('spr')).toBe('https');
    expect(sas.get('se')).toBe('2026-07-04T00:15:00Z');
    const expected = createHmac('sha256', Buffer.from(cfg.azureAccountKey, 'base64'))
      .update(azureSasStringToSign(input), 'utf8')
      .digest('base64');
    expect(sas.get('sig')).toBe(expected);
  });
});

describe('AzureLogStorage.listLogFiles', () => {
  const now = () => new Date('2026-07-04T00:00:00.000Z');

  it('paginates via NextMarker, filters by covered date, returns SAS URLs', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: async () => listXml([key('20260603')], 'M1') })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => listXml([key('20260605'), 'noise.txt']),
      });
    const storage = new AzureLogStorage(cfg, { fetchFn: fetchFn as unknown as typeof fetch, now });
    const { files, truncated } = await storage.listLogFiles('2026-06-01', '2026-06-10');

    expect(fetchFn).toHaveBeenCalledTimes(2);
    const firstUrl: string = fetchFn.mock.calls[0][0];
    expect(firstUrl).toContain(
      'https://acct.blob.core.windows.net/logs?restype=container&comp=list'
    );
    expect(firstUrl).toContain('prefix=contentful-audit-');
    const secondUrl: string = fetchFn.mock.calls[1][0];
    expect(secondUrl).toContain('marker=M1');

    expect(truncated).toBe(false);
    expect(files.map((f) => f.coveredDate)).toEqual(['2026-06-04', '2026-06-02']); // newest first
    for (const f of files) {
      expect(f.url).toContain(`https://acct.blob.core.windows.net/logs/${f.key}?`);
      expect(f.url).toContain('sp=r');
      expect(f.url).toContain('sr=b');
      expect(f.url).toContain('se=2026-07-04T00%3A15%3A00Z'); // now + 900s, URL-encoded
      expect(f.url).toContain('sig=');
    }
  });

  it('honors the configured prefix', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, text: async () => listXml([]) });
    await new AzureLogStorage(
      { ...cfg, prefix: 'audit/' },
      { fetchFn: fetchFn as unknown as typeof fetch, now }
    ).listLogFiles('2026-06-01', '2026-06-10');
    expect(fetchFn.mock.calls[0][0]).toContain(
      `prefix=${encodeURIComponent('audit/contentful-audit-')}`
    );
  });

  it('throws a clean error on non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => '' });
    await expect(
      new AzureLogStorage(cfg, { fetchFn: fetchFn as unknown as typeof fetch, now }).listLogFiles(
        '2026-06-01',
        '2026-06-10'
      )
    ).rejects.toThrow('Azure list failed: HTTP 403');
  });

  it('appends the upstream error detail when the body has one', async () => {
    const body =
      '<?xml version="1.0" encoding="utf-8"?><Error><Code>AuthenticationFailed</Code>' +
      '<AuthenticationErrorDetail>Signature did not match</AuthenticationErrorDetail></Error>';
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => body });
    await expect(
      new AzureLogStorage(cfg, { fetchFn: fetchFn as unknown as typeof fetch, now }).listLogFiles(
        '2026-06-01',
        '2026-06-10'
      )
    ).rejects.toThrow(
      'Azure list failed: HTTP 403 — AuthenticationFailed: Signature did not match'
    );
  });
});

describe('AzureLogStorage input validation', () => {
  const now = () => new Date('2026-07-04T00:00:00.000Z');

  it('rejects an invalid account name at construction', () => {
    expect(() => new AzureLogStorage({ ...cfg, azureAccountName: 'Invalid_Name!' })).toThrow(
      'azureAccountName must be 3-24 lowercase letters/digits'
    );
  });

  it('rejects a non-base64 account key when minting a SAS', async () => {
    const fetchFn = vi.fn();
    const storage = new AzureLogStorage(
      { ...cfg, azureAccountKey: 'not-base64!!!' },
      { fetchFn: fetchFn as unknown as typeof fetch, now }
    );
    await expect(storage.listLogFiles('2026-06-01', '2026-06-10')).rejects.toThrow(
      'azureAccountKey is not valid base64'
    );
  });
});

describe('azureErrorDetail', () => {
  it('returns "" for an empty or absent body', () => {
    expect(azureErrorDetail('')).toBe('');
  });

  it('extracts Code and AuthenticationErrorDetail from an Azure XML error body', () => {
    const body =
      '<Error><Code>AuthenticationFailed</Code>' +
      '<AuthenticationErrorDetail>Signature did not match</AuthenticationErrorDetail></Error>';
    expect(azureErrorDetail(body)).toBe('AuthenticationFailed: Signature did not match');
  });

  it('caps the extract at 200 characters', () => {
    const long = 'x'.repeat(500);
    const body = `<Error><Code>AuthenticationFailed</Code><Message>${long}</Message></Error>`;
    expect(azureErrorDetail(body).length).toBeLessThanOrEqual(200);
  });
});

describe('factory', () => {
  it('routes provider=azure to AzureLogStorage', () => {
    expect(createStorage({ provider: 'azure', ...cfg })).toBeInstanceOf(AzureLogStorage);
  });
});
