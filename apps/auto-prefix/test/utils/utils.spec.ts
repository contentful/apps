import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isEntryRecentlyCreated } from '../../src/utils/utils';

describe('entryUtils', () => {
  describe('isEntryRecentlyCreated', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for an entry created just now', () => {
      const now = new Date();
      const createdAt = now.toISOString();

      expect(isEntryRecentlyCreated(createdAt)).toBe(true);
    });

    it('should return true for an entry created 29 seconds ago', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 29 * 1000).toISOString();

      expect(isEntryRecentlyCreated(createdAt)).toBe(true);
    });

    it('should return false for an entry created 31 seconds ago', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 31 * 1000).toISOString();

      expect(isEntryRecentlyCreated(createdAt)).toBe(false);
    });

    it('should return false for an entry created exactly 30 seconds ago', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 30 * 1000).toISOString();

      expect(isEntryRecentlyCreated(createdAt)).toBe(false);
    });
  });
});
