// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { MAX_FILES, S3LogStorage } from '../lib/storage/s3';
import type { StorageConfig } from '../lib/storage/types';

const cfg: StorageConfig = {
  bucketName: 'test-bucket',
  region: 'eu-west-1',
  awsAccessKeyId: 'AKIATEST',
  awsSecretAccessKey: 'secret',
};

const key = (yyyymmdd: string) => `contentful-audit-org1-${yyyymmdd}T040000000Z.json`;

function fakeStorage(pages: Array<{ Contents: { Key: string; Size?: number }[]; NextContinuationToken?: string }>) {
  let call = 0;
  const send = vi.fn(async () => {
    const page = pages[call++];
    return { ...page, IsTruncated: Boolean(page.NextContinuationToken) };
  });
  const presign = vi.fn(async (_s3: unknown, _bucket: string, k: string) => `https://signed/${k}`);
  const storage = new S3LogStorage(cfg, {
    getClient: async () => ({ send }) as never,
    presign,
  });
  return { storage, send, presign };
}

describe('S3LogStorage.listLogFiles', () => {
  it('returns only files whose covered date is inside the range, with presigned URLs', async () => {
    const { storage } = fakeStorage([
      {
        Contents: [
          { Key: key('20260601'), Size: 10 }, // covers 2026-05-31 → out
          { Key: key('20260603'), Size: 20 }, // covers 2026-06-02 → in
          { Key: 'unrelated.txt', Size: 1 },
        ],
      },
    ]);
    const result = await storage.listLogFiles('2026-06-01', '2026-06-10');
    expect(result.files).toEqual([
      {
        key: key('20260603'),
        size: 20,
        coveredDate: '2026-06-02',
        url: `https://signed/${key('20260603')}`,
      },
    ]);
    expect(result.truncated).toBe(false);
  });

  it('paginates through continuation tokens', async () => {
    const { storage, send } = fakeStorage([
      { Contents: [{ Key: key('20260603'), Size: 1 }], NextContinuationToken: 't1' },
      { Contents: [{ Key: key('20260604'), Size: 1 }] },
    ]);
    const result = await storage.listLogFiles('2026-06-01', '2026-06-10');
    expect(send).toHaveBeenCalledTimes(2);
    expect(result.files).toHaveLength(2);
  });

  it('sorts newest first, caps at MAX_FILES and sets truncated', async () => {
    const contents = Array.from({ length: MAX_FILES + 5 }, (_, i) => ({
      Key: key(`202601${String((i % 28) + 1).padStart(2, '0')}`),
      Size: 1,
    }));
    const { storage } = fakeStorage([{ Contents: contents }]);
    const result = await storage.listLogFiles('2025-12-01', '2026-02-28');
    expect(result.files).toHaveLength(MAX_FILES);
    expect(result.truncated).toBe(true);
    expect(result.files[0].coveredDate >= result.files[1].coveredDate).toBe(true);
  });

  it('lists with the configured prefix + contentful-audit-', async () => {
    const { storage, send } = fakeStorage([{ Contents: [] }]);
    await new S3LogStorage({ ...cfg, prefix: 'audit/' }, {
      getClient: async () => ({ send }) as never,
      presign: async () => 'u',
    }).listLogFiles('2026-06-01', '2026-06-10');
    const cmdInput = send.mock.calls[0][0].input;
    expect(cmdInput.Prefix).toBe('audit/contentful-audit-');
    expect(cmdInput.Bucket).toBe('test-bucket');
    void storage;
  });
});
