import { describe, expect, it, vi } from 'vitest';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import {
  RobotsOutputCandidate,
  applyOutputsToEntry,
  buildOutputCandidates,
  currentFieldValue,
  defaultTargetFieldId,
  entryFieldOptions,
  formatFieldValue,
  preferredTargetFieldId,
  richTextDocument,
  valueForField,
  wouldOverwrite,
} from './robotsEntryMapping';
import { RobotsOutputs } from './robotsTypes';

interface FakeField {
  id: string;
  type: string;
  items?: { type: string };
  value?: unknown;
  locales?: string[];
  setValue?: ReturnType<typeof vi.fn>;
}

const buildSdk = (fields: FakeField[], muxFieldId = 'muxVideo'): FieldExtensionSDK => {
  const entryFields = Object.fromEntries(
    fields.map((field) => [
      field.id,
      {
        id: field.id,
        type: field.type,
        items: field.items,
        locales: field.locales ?? ['en-US'],
        getValue: () => field.value,
        setValue: field.setValue ?? vi.fn(async () => undefined),
      },
    ])
  );

  return {
    field: { id: muxFieldId },
    locales: { default: 'en-US' },
    contentType: {
      fields: fields.map((field) => ({ id: field.id, name: `${field.id} label` })),
    },
    entry: { fields: entryFields },
    notifier: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  } as unknown as FieldExtensionSDK;
};

const summary: RobotsOutputs = {
  summarize: {
    jobId: 'rjob_1',
    title: 'Generated title',
    description: 'Generated description',
    tags: ['alpha', 'beta'],
  },
};

describe('entryFieldOptions', () => {
  it('reads names and types straight off the SDK, needing no configuration', () => {
    const sdk = buildSdk([
      { id: 'title', type: 'Symbol' },
      { id: 'tags', type: 'Array', items: { type: 'Symbol' } },
      { id: 'muxVideo', type: 'Object' },
    ]);

    expect(entryFieldOptions(sdk)).toEqual([
      { id: 'title', name: 'title label', type: 'Symbol', itemsType: undefined },
      { id: 'tags', name: 'tags label', type: 'Array', itemsType: 'Symbol' },
    ]);
  });
});

describe('buildOutputCandidates', () => {
  it('pre-fills by convention', () => {
    const sdk = buildSdk([
      { id: 'title', type: 'Symbol' },
      { id: 'description', type: 'Text' },
      { id: 'tags', type: 'Array', items: { type: 'Symbol' } },
    ]);

    const candidates = buildOutputCandidates(sdk, summary);

    expect(candidates.map((candidate) => [candidate.key, candidate.suggestedFieldId])).toEqual([
      ['title', 'title'],
      ['description', 'description'],
      ['tags', 'tags'],
    ]);
  });

  it('prefers the more specific name when several match', () => {
    const sdk = buildSdk([
      { id: 'description', type: 'Text' },
      { id: 'seoDescription', type: 'Text' },
    ]);

    const description = buildOutputCandidates(sdk, summary).find(
      (candidate) => candidate.key === 'description'
    );
    expect(description?.suggestedFieldId).toBe('seoDescription');
  });

  it('only offers type-compatible fields', () => {
    const sdk = buildSdk([
      { id: 'title', type: 'Symbol' },
      { id: 'publishedAt', type: 'Date' },
      { id: 'viewCount', type: 'Integer' },
      { id: 'tags', type: 'Array', items: { type: 'Symbol' } },
    ]);

    const candidates = buildOutputCandidates(sdk, summary);
    const titleCandidate = candidates.find((candidate) => candidate.key === 'title');
    const tagsCandidate = candidates.find((candidate) => candidate.key === 'tags');

    expect(titleCandidate?.compatibleFieldIds).toEqual(['title']);
    expect(tagsCandidate?.compatibleFieldIds).toEqual(['tags']);
  });

  it('offers rich text fields for text outputs, but never for tags', () => {
    const sdk = buildSdk([
      { id: 'body', type: 'RichText' },
      { id: 'tagsRich', type: 'RichText' },
    ]);

    const candidates = buildOutputCandidates(sdk, summary);

    expect(
      candidates.find((candidate) => candidate.key === 'description')?.compatibleFieldIds
    ).toEqual(['body', 'tagsRich']);
    expect(candidates.find((candidate) => candidate.key === 'title')?.compatibleFieldIds).toEqual([
      'body',
      'tagsRich',
    ]);
    // A list of strings has no home in a document, so this one stays refused.
    expect(candidates.find((candidate) => candidate.key === 'tags')?.compatibleFieldIds).toEqual(
      []
    );
  });

  it('suggests a rich text field by the same convention as a plain one', () => {
    const sdk = buildSdk([{ id: 'description', type: 'RichText' }]);

    const description = buildOutputCandidates(sdk, summary).find(
      (candidate) => candidate.key === 'description'
    );

    expect(description?.suggestedFieldId).toBe('description');
  });

  it('reports no suggestion rather than guessing when nothing matches the convention', () => {
    const sdk = buildSdk([{ id: 'someOtherText', type: 'Symbol' }]);

    const titleCandidate = buildOutputCandidates(sdk, summary).find(
      (candidate) => candidate.key === 'title'
    );

    expect(titleCandidate?.suggestedFieldId).toBeUndefined();
    expect(titleCandidate?.compatibleFieldIds).toEqual(['someOtherText']);
  });

  it('offers nothing without a summary', () => {
    const sdk = buildSdk([{ id: 'title', type: 'Symbol' }]);
    expect(buildOutputCandidates(sdk, undefined)).toEqual([]);
    expect(buildOutputCandidates(sdk, { moderate: { jobId: 'rjob_2' } })).toEqual([]);
  });

  it('skips outputs the job did not produce', () => {
    const sdk = buildSdk([
      { id: 'title', type: 'Symbol' },
      { id: 'tags', type: 'Array', items: { type: 'Symbol' } },
    ]);

    const candidates = buildOutputCandidates(sdk, {
      summarize: { jobId: 'rjob_1', title: 'Only a title' },
    });

    expect(candidates.map((candidate) => candidate.key)).toEqual(['title']);
  });
});

describe('wouldOverwrite', () => {
  it('treats empty values as safe to fill', () => {
    expect(wouldOverwrite(undefined)).toBe(false);
    expect(wouldOverwrite('')).toBe(false);
    expect(wouldOverwrite([])).toBe(false);
  });

  it('flags anything the editor already wrote', () => {
    expect(wouldOverwrite('Existing')).toBe(true);
    expect(wouldOverwrite(['a'])).toBe(true);
    expect(wouldOverwrite(0)).toBe(true);
  });

  // A Rich Text field the editor merely clicked into holds a document, not `undefined`, so an
  // object test alone would call every such field occupied and never pre-fill one.
  it('sees through a rich text document to whether it actually says anything', () => {
    expect(wouldOverwrite(richTextDocument(''))).toBe(false);
    expect(wouldOverwrite(richTextDocument('   '))).toBe(false);
    expect(wouldOverwrite(richTextDocument('Existing copy'))).toBe(true);
  });
});

describe('preferredTargetFieldId', () => {
  it('prefers the convention, and falls back to anything compatible', () => {
    expect(
      preferredTargetFieldId({
        key: 'title',
        label: 'Title',
        value: 'x',
        compatibleFieldIds: ['a', 'b'],
        suggestedFieldId: 'b',
      })
    ).toBe('b');

    expect(
      preferredTargetFieldId({
        key: 'title',
        label: 'Title',
        value: 'x',
        compatibleFieldIds: ['a', 'b'],
      })
    ).toBe('a');

    expect(
      preferredTargetFieldId({ key: 'title', label: 'Title', value: 'x', compatibleFieldIds: [] })
    ).toBe('');
  });
});

describe('defaultTargetFieldId', () => {
  // The target dropdown is the only control on a row now, so pre-filling it is consent to write.
  // ADR-0004's "do not overwrite by default" rule therefore lives here rather than on a checkbox.
  it('pre-fills a field that is empty', () => {
    const sdk = buildSdk([{ id: 'title', type: 'Symbol' }]);
    const candidate = buildOutputCandidates(sdk, summary)[0];
    expect(defaultTargetFieldId(sdk, candidate, 'en-US')).toBe('title');
  });

  it('refuses to pre-fill a field that already has content', () => {
    const sdk = buildSdk([{ id: 'title', type: 'Symbol', value: 'The editor’s own title' }]);
    const candidate = buildOutputCandidates(sdk, summary)[0];
    expect(defaultTargetFieldId(sdk, candidate, 'en-US')).toBe('');
  });

  it('has nothing to pre-fill when no field is compatible', () => {
    const sdk = buildSdk([{ id: 'publishedAt', type: 'Date' }]);
    const candidate = buildOutputCandidates(sdk, summary)[0];
    expect(defaultTargetFieldId(sdk, candidate, 'en-US')).toBe('');
  });
});

describe('richTextDocument', () => {
  /**
   * Pinned against `@contentful/rich-text-types@16.8.5` — its `EMPTY_DOCUMENT` with a value in the
   * text node. `data` on every node and `marks` on the text node are required even when empty, and
   * a document missing either is one Contentful's rich text editor will not render.
   */
  it('builds the exact document shape Contentful validates', () => {
    expect(richTextDocument('A generated description')).toEqual({
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            { nodeType: 'text', value: 'A generated description', marks: [], data: {} },
          ],
        },
      ],
    });
  });
});

describe('valueForField', () => {
  it('wraps a string for a rich text field and leaves every other type alone', () => {
    expect(valueForField('Some text', 'RichText')).toEqual(richTextDocument('Some text'));
    expect(valueForField('Some text', 'Symbol')).toBe('Some text');
    expect(valueForField('Some text', 'Text')).toBe('Some text');
    expect(valueForField(['a', 'b'], 'Array')).toEqual(['a', 'b']);
  });

  it('never wraps a list, which no rich text field could hold anyway', () => {
    expect(valueForField(['a', 'b'], 'RichText')).toEqual(['a', 'b']);
  });
});

describe('currentFieldValue', () => {
  it('falls back to the field’s own locale when it is not localized', () => {
    const sdk = buildSdk([
      { id: 'title', type: 'Symbol', locales: ['de-DE'], value: 'Ein Titel' },
    ]);
    expect(currentFieldValue(sdk, 'title', 'en-US')).toBe('Ein Titel');
  });

  it('returns undefined for a field that no longer exists', () => {
    const sdk = buildSdk([{ id: 'title', type: 'Symbol' }]);
    expect(currentFieldValue(sdk, 'gone', 'en-US')).toBeUndefined();
  });
});

describe('formatFieldValue', () => {
  it('renders lists readably', () => {
    expect(formatFieldValue(['a', 'b'])).toBe('a, b');
    expect(formatFieldValue('plain')).toBe('plain');
    expect(formatFieldValue(undefined)).toBe('');
  });

  it('reads a rich text document as its text, not as JSON', () => {
    expect(formatFieldValue(richTextDocument('What the field says'))).toBe('What the field says');
  });

  it('keeps paragraphs apart and marked-up runs together', () => {
    const document = {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            { nodeType: 'text', value: 'Plain and ', marks: [], data: {} },
            { nodeType: 'text', value: 'bold', marks: [{ type: 'bold' }], data: {} },
          ],
        },
        {
          nodeType: 'paragraph',
          data: {},
          content: [{ nodeType: 'text', value: 'Second paragraph', marks: [], data: {} }],
        },
      ],
    };

    expect(formatFieldValue(document)).toBe('Plain and bold Second paragraph');
  });

  it('still falls back to JSON for an object that is not a document', () => {
    expect(formatFieldValue({ lat: 1, lon: 2 })).toBe('{"lat":1,"lon":2}');
  });

  /**
   * "Has a `nodeType`" is not the same question as "is a rich text value". Only a `document` is
   * one — a loose `paragraph` is a fragment of something, and flattening it to its text would
   * claim to have read a field that nobody stores that way.
   */
  it('does not read a loose node as a rich text value', () => {
    const paragraph = {
      nodeType: 'paragraph',
      data: {},
      content: [{ nodeType: 'text', value: 'Loose', marks: [], data: {} }],
    };

    expect(formatFieldValue(paragraph)).toBe(JSON.stringify(paragraph));
    expect(wouldOverwrite({ nodeType: 'paragraph', data: {}, content: [] })).toBe(true);
  });

  /**
   * A field value arrives from the SDK as `unknown`, so every narrowing in the walk is load-bearing
   * — a document that is a document in name only must preview as nothing rather than throw on the
   * way to rendering a table cell.
   */
  it('survives a document whose nodes are not what the schema promises', () => {
    expect(formatFieldValue({ nodeType: 'document', data: {} })).toBe('');
    expect(
      formatFieldValue({
        nodeType: 'document',
        data: {},
        content: [
          { nodeType: 'paragraph', data: {}, content: [] },
          {
            nodeType: 'paragraph',
            data: {},
            content: [{ nodeType: 'text', value: 42, marks: [], data: {} }],
          },
          'not a node',
          {
            nodeType: 'paragraph',
            data: {},
            content: [{ nodeType: 'text', value: 'The only real text', marks: [], data: {} }],
          },
        ],
      })
      // No leading or doubled spaces from the blank blocks either.
    ).toBe('The only real text');
  });
});

describe('applyOutputsToEntry', () => {
  it('writes only the selected fields, in the requested locale', async () => {
    const titleSetValue = vi.fn(async () => undefined);
    const tagsSetValue = vi.fn(async () => undefined);
    const sdk = buildSdk([
      { id: 'title', type: 'Symbol', setValue: titleSetValue },
      { id: 'tags', type: 'Array', items: { type: 'Symbol' }, setValue: tagsSetValue },
    ]);
    const candidates = buildOutputCandidates(sdk, summary);
    const titleCandidate = candidates.find(
      (candidate) => candidate.key === 'title'
    ) as RobotsOutputCandidate;

    const result = await applyOutputsToEntry(
      sdk,
      [{ candidate: titleCandidate, fieldId: 'title' }],
      'en-US'
    );

    expect(titleSetValue).toHaveBeenCalledWith('Generated title', 'en-US');
    expect(tagsSetValue).not.toHaveBeenCalled();
    expect(result.applied).toEqual([{ fieldId: 'title', key: 'title' }]);
    expect(result.failed).toEqual([]);
  });

  it('keeps going when one field is rejected, and reports which', async () => {
    const sdk = buildSdk([
      {
        id: 'title',
        type: 'Symbol',
        setValue: vi.fn(async () => {
          throw new Error('Too long');
        }),
      },
      { id: 'tags', type: 'Array', items: { type: 'Symbol' } },
    ]);
    const candidates = buildOutputCandidates(sdk, summary);

    const result = await applyOutputsToEntry(
      sdk,
      candidates
        .filter((candidate) => candidate.key !== 'description')
        .map((candidate) => ({ candidate, fieldId: candidate.key })),
      'en-US'
    );

    expect(result.applied).toEqual([{ fieldId: 'tags', key: 'tags' }]);
    expect(result.failed).toEqual([{ fieldId: 'title', key: 'title', message: 'Too long' }]);
  });

  /**
   * The bug this covers: a Rich Text field holds a node tree, and `setValue('some string')` on one
   * corrupts it — the entry editor cannot render a string where it expects a document. The check
   * that used to refuse rich text was therefore right until the conversion existed.
   */
  it('writes a document to a rich text field, not the bare string', async () => {
    const setValue = vi.fn(async () => undefined);
    const sdk = buildSdk([{ id: 'description', type: 'RichText', setValue }]);
    const candidate = buildOutputCandidates(sdk, summary).find(
      (entry) => entry.key === 'description'
    ) as RobotsOutputCandidate;

    await applyOutputsToEntry(sdk, [{ candidate, fieldId: 'description' }], 'en-US');

    expect(setValue).toHaveBeenCalledWith(richTextDocument('Generated description'), 'en-US');
  });

  it('still writes a plain string to a plain text field', async () => {
    const setValue = vi.fn(async () => undefined);
    const sdk = buildSdk([{ id: 'description', type: 'Text', setValue }]);
    const candidate = buildOutputCandidates(sdk, summary).find(
      (entry) => entry.key === 'description'
    ) as RobotsOutputCandidate;

    await applyOutputsToEntry(sdk, [{ candidate, fieldId: 'description' }], 'en-US');

    expect(setValue).toHaveBeenCalledWith('Generated description', 'en-US');
  });

  it('reports a field that disappeared instead of throwing', async () => {
    const sdk = buildSdk([{ id: 'title', type: 'Symbol' }]);
    const candidate = buildOutputCandidates(sdk, summary)[0];

    const result = await applyOutputsToEntry(sdk, [{ candidate, fieldId: 'gone' }], 'en-US');

    expect(result.failed[0].message).toBe('Field no longer exists.');
  });
});
