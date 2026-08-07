// updateEntries.reference.spec.ts
//
// Proof-of-concept coverage for CCS-3539: confirms updateEntries actually
// copies a reference Link value across locales when it's adopted, the same
// way it already copies plain text fields. This has always worked at the
// CMA-write layer (updateSingleEntry is field-type-agnostic) -- the bug was
// that reference fields never made it into the adopted-fields set upstream.
// This test locks in that the write path handles Link values correctly now
// that they can reach it.
import { describe, it, expect, vi } from 'vitest';
import { updateEntries } from '../src/utils/entry';

describe('updateEntries: copies reference field links across locales (CCS-3539)', () => {
  it('copies a single-entry Link value from the source locale to all target locales', async () => {
    const entry = {
      sys: { id: 'entry-1' },
      fields: {
        relatedArticle: {
          'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' } },
        },
      },
    };

    const cma: any = {
      entry: {
        get: vi.fn().mockResolvedValue(entry),
        update: vi.fn().mockResolvedValue(entry),
      },
    };

    const result = await updateEntries(cma, 'entry-1', 'en-US', ['fr', 'de'], {
      'entry-1': { relatedArticle: true },
    });

    expect(result.errors).toBeUndefined();
    expect(result.fieldsUpdated).toBe(1);
    expect(result.entriesUpdated).toBe(1);

    const updatedEntry = cma.entry.update.mock.calls[0][1];
    expect(updatedEntry.fields.relatedArticle.fr).toEqual({
      sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' },
    });
    expect(updatedEntry.fields.relatedArticle.de).toEqual({
      sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' },
    });
    // Source locale value is untouched.
    expect(updatedEntry.fields.relatedArticle['en-US']).toEqual({
      sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' },
    });
  });

  it('copies an Array-of-Link value from the source locale to all target locales', async () => {
    const entry = {
      sys: { id: 'entry-1' },
      fields: {
        relatedArticles: {
          'en-US': [
            { sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' } },
            { sys: { type: 'Link', linkType: 'Entry', id: 'entry-3' } },
          ],
        },
      },
    };

    const cma: any = {
      entry: {
        get: vi.fn().mockResolvedValue(entry),
        update: vi.fn().mockResolvedValue(entry),
      },
    };

    const result = await updateEntries(cma, 'entry-1', 'en-US', ['fr'], {
      'entry-1': { relatedArticles: true },
    });

    expect(result.errors).toBeUndefined();
    expect(result.fieldsUpdated).toBe(1);

    const updatedEntry = cma.entry.update.mock.calls[0][1];
    expect(updatedEntry.fields.relatedArticles.fr).toEqual([
      { sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' } },
      { sys: { type: 'Link', linkType: 'Entry', id: 'entry-3' } },
    ]);
  });

  it('does not touch a reference field that was not adopted', async () => {
    const entry = {
      sys: { id: 'entry-1' },
      fields: {
        title: { 'en-US': 'Hello' },
        relatedArticle: {
          'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' } },
        },
      },
    };

    const cma: any = {
      entry: {
        get: vi.fn().mockResolvedValue(entry),
        update: vi.fn().mockResolvedValue(entry),
      },
    };

    await updateEntries(cma, 'entry-1', 'en-US', ['fr'], {
      'entry-1': { title: true, relatedArticle: false },
    });

    const updatedEntry = cma.entry.update.mock.calls[0][1];
    expect(updatedEntry.fields.title.fr).toBe('Hello');
    expect(updatedEntry.fields.relatedArticle?.fr).toBeUndefined();
  });
});
