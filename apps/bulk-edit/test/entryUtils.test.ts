import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEntriesInBatches } from '../src/locations/Page/utils/entryUtils';

// Mock Contentful SDK
const mockSdk = {
  cma: {
    entry: {
      getMany: vi.fn(),
    },
  },
  ids: {
    space: 'test-space',
    environment: 'test-environment',
  },
};

describe('fetchEntriesInBatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch entries in batches successfully', async () => {
    // Mock response for first batch
    mockSdk.cma.entry.getMany.mockResolvedValueOnce({
      items: Array.from({ length: 100 }, (_, i) => ({
        sys: { id: `entry-${i}`, type: 'Entry' },
        fields: { title: { 'en-US': `Entry ${i}` } },
      })),
      total: 250,
    });

    // Mock response for second batch
    mockSdk.cma.entry.getMany.mockResolvedValueOnce({
      items: Array.from({ length: 100 }, (_, i) => ({
        sys: { id: `entry-${i + 100}`, type: 'Entry' },
        fields: { title: { 'en-US': `Entry ${i + 100}` } },
      })),
      total: 250,
    });

    // Mock response for third batch (partial)
    mockSdk.cma.entry.getMany.mockResolvedValueOnce({
      items: Array.from({ length: 50 }, (_, i) => ({
        sys: { id: `entry-${i + 200}`, type: 'Entry' },
        fields: { title: { 'en-US': `Entry ${i + 200}` } },
      })),
      total: 250,
    });

    const query = { content_type: 'test-content-type' };
    const result = await fetchEntriesInBatches(mockSdk, query, 100, 250);

    expect(result.entries).toHaveLength(250);
    expect(result.total).toBe(250);
    expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(3);
  });

  it('should handle response size errors by reducing batch size', async () => {
    // Mock response size error on first call
    mockSdk.cma.entry.getMany.mockRejectedValueOnce({
      message: 'Response size too big. Maximum allowed response size: 7340032B.',
    });

    // Mock successful response with smaller batch size
    mockSdk.cma.entry.getMany.mockResolvedValueOnce({
      items: Array.from({ length: 50 }, (_, i) => ({
        sys: { id: `entry-${i}`, type: 'Entry' },
        fields: { title: { 'en-US': `Entry ${i}` } },
      })),
      total: 50,
    });

    const query = { content_type: 'test-content-type' };
    const result = await fetchEntriesInBatches(mockSdk, query, 100, 50);

    expect(result.entries).toHaveLength(50);
    expect(result.total).toBe(50);
    expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(2);
  });

  it('should respect maxEntries limit', async () => {
    // Mock response for first batch
    mockSdk.cma.entry.getMany.mockResolvedValueOnce({
      items: Array.from({ length: 100 }, (_, i) => ({
        sys: { id: `entry-${i}`, type: 'Entry' },
        fields: { title: { 'en-US': `Entry ${i}` } },
      })),
      total: 1000,
    });

    const query = { content_type: 'test-content-type' };
    const result = await fetchEntriesInBatches(mockSdk, query, 100, 100);

    expect(result.entries).toHaveLength(100);
    expect(result.total).toBe(1000);
    expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(1);
  });

  it('should handle empty results', async () => {
    mockSdk.cma.entry.getMany.mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const query = { content_type: 'test-content-type' };
    const result = await fetchEntriesInBatches(mockSdk, query, 100);

    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(1);
  });
});
