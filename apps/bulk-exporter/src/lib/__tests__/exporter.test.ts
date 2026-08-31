import { describe, it, expect, vi } from 'vitest';
import { Exporter, type ExportProgress } from '../exporter';

describe('Exporter', () => {
  it('surfaces the real CMA error message even when the error is not an Error instance', async () => {
    // Matches ES-630: the app-sdk's postMessage bridge relays the raw CMA
    // error object (not an `Error`), so `error instanceof Error` misses it.
    const cmaError = {
      sys: { type: 'Error', id: 'BadRequest' },
      message: 'Response size too big. Maximum allowed response size: 7340032B.',
      requestId: '9a90d083-9da4-46c0-adcf-cad04aea653a',
    };

    const mockCma = {
      entry: {
        getMany: vi.fn().mockRejectedValue(cmaError),
      },
    };

    const exporter = new Exporter(mockCma as any);
    const progressUpdates: ExportProgress[] = [];

    await expect(
      exporter.start({ contentType: null, contentTypeId: 'statement', locales: ['en-US'] }, (p) =>
        progressUpdates.push(p)
      )
    ).rejects.toBe(cmaError);

    const errorUpdate = progressUpdates.find((p) => p.status === 'error');
    expect(errorUpdate?.message).toBe(
      'Export failed: Response size too big. Maximum allowed response size: 7340032B.'
    );
  });

  it('falls back to "Unknown error" when the thrown value has no message', async () => {
    const mockCma = {
      entry: {
        getMany: vi.fn().mockRejectedValue('not an object'),
      },
    };

    const exporter = new Exporter(mockCma as any);
    const progressUpdates: ExportProgress[] = [];

    await expect(
      exporter.start({ contentType: null, contentTypeId: 'statement', locales: ['en-US'] }, (p) =>
        progressUpdates.push(p)
      )
    ).rejects.toBe('not an object');

    const errorUpdate = progressUpdates.find((p) => p.status === 'error');
    expect(errorUpdate?.message).toBe('Export failed: Unknown error');
  });
});
