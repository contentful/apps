import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  getFieldPreferences,
  saveFieldPreferences,
  clearFieldPreferences,
  getSpacePreferences,
  saveSpacePreferences,
} from '../preferences';

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('preferences', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock(),
      configurable: true,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('field preferences', () => {
    it('returns null when nothing is saved', () => {
      expect(getFieldPreferences('space1', 'blogPost')).toBeNull();
    });

    it('saves and retrieves field preferences', () => {
      const ok = saveFieldPreferences('space1', 'blogPost', {
        selectedFields: ['title', 'slug'],
        lastPreset: 'essentials',
      });

      expect(ok).toBe(true);

      const result = getFieldPreferences('space1', 'blogPost');
      expect(result?.selectedFields).toEqual(['title', 'slug']);
      expect(result?.lastPreset).toBe('essentials');
      expect(result?.updatedAt).toBeTruthy();
    });

    it('isolates preferences per space', () => {
      saveFieldPreferences('space1', 'blogPost', {
        selectedFields: ['title'],
        lastPreset: 'custom',
      });
      saveFieldPreferences('space2', 'blogPost', {
        selectedFields: ['body'],
        lastPreset: 'custom',
      });

      expect(getFieldPreferences('space1', 'blogPost')?.selectedFields).toEqual(['title']);
      expect(getFieldPreferences('space2', 'blogPost')?.selectedFields).toEqual(['body']);
    });

    it('isolates preferences per content type', () => {
      saveFieldPreferences('space1', 'blogPost', {
        selectedFields: ['title'],
        lastPreset: 'custom',
      });
      saveFieldPreferences('space1', 'product', {
        selectedFields: ['sku'],
        lastPreset: 'custom',
      });

      expect(getFieldPreferences('space1', 'blogPost')?.selectedFields).toEqual(['title']);
      expect(getFieldPreferences('space1', 'product')?.selectedFields).toEqual(['sku']);
    });

    it('clears field preferences', () => {
      saveFieldPreferences('space1', 'blogPost', {
        selectedFields: ['title'],
        lastPreset: 'essentials',
      });
      clearFieldPreferences('space1', 'blogPost');

      expect(getFieldPreferences('space1', 'blogPost')).toBeNull();
    });

    it('rejects empty space or content type IDs gracefully', () => {
      expect(saveFieldPreferences('', 'blogPost', { selectedFields: [], lastPreset: 'all' })).toBe(false);
      expect(saveFieldPreferences('space1', '', { selectedFields: [], lastPreset: 'all' })).toBe(false);
      expect(getFieldPreferences('', 'blogPost')).toBeNull();
      expect(getFieldPreferences('space1', '')).toBeNull();
    });

    it('handles malformed JSON in storage gracefully', () => {
      window.localStorage.setItem('bulk-entry-exporter:v1:fields:space1:blogPost', 'not valid json');
      expect(getFieldPreferences('space1', 'blogPost')).toBeNull();
    });
  });

  describe('space preferences', () => {
    it('returns empty object when nothing saved', () => {
      expect(getSpacePreferences('space1')).toEqual({});
    });

    it('persists format and filename pattern', () => {
      saveSpacePreferences('space1', { format: 'json' });
      saveSpacePreferences('space1', { filenamePattern: 'my-export' });

      const prefs = getSpacePreferences('space1');
      expect(prefs.format).toBe('json');
      expect(prefs.filenamePattern).toBe('my-export');
    });

    it('merges patches without losing other fields', () => {
      saveSpacePreferences('space1', { format: 'xlsx', filenamePattern: 'first' });
      saveSpacePreferences('space1', { format: 'yaml' });

      const prefs = getSpacePreferences('space1');
      expect(prefs.format).toBe('yaml');
      expect(prefs.filenamePattern).toBe('first');
    });

    it('isolates space preferences', () => {
      saveSpacePreferences('space1', { format: 'csv' });
      saveSpacePreferences('space2', { format: 'json' });

      expect(getSpacePreferences('space1').format).toBe('csv');
      expect(getSpacePreferences('space2').format).toBe('json');
    });
  });
});
