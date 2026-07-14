import { describe, it, expect } from 'vitest';
import { getSmartDefaults, applyPreset, groupFields, detectPreset } from '../fieldSelection';
import type { ContentType } from '../flatten';

const blogPost: ContentType = {
  sys: { id: 'blogPost' },
  name: 'Blog Post',
  displayField: 'title',
  fields: [
    { id: 'title', name: 'Title', type: 'Symbol', localized: false, required: true },
    { id: 'slug', name: 'Slug', type: 'Symbol', localized: false, required: true },
    { id: 'body', name: 'Body', type: 'RichText', localized: false, required: false },
    {
      id: 'author',
      name: 'Author',
      type: 'Link',
      linkType: 'Entry',
      localized: false,
      required: false,
    },
    {
      id: 'tags',
      name: 'Tags',
      type: 'Array',
      items: { type: 'Symbol' },
      localized: false,
      required: false,
    },
    {
      id: 'related',
      name: 'Related',
      type: 'Array',
      items: { type: 'Link', linkType: 'Entry' },
      localized: false,
      required: false,
    },
    { id: 'metadata', name: 'Metadata', type: 'Object', localized: false, required: false },
  ],
};

describe('getSmartDefaults', () => {
  it('selects display field, semantic fields, and required Symbols', () => {
    const result = getSmartDefaults(blogPost);
    expect(result).toContain('title');
    expect(result).toContain('slug');
    expect(result).not.toContain('body');
    expect(result).not.toContain('metadata');
  });

  it('returns at least the display field if defined', () => {
    const minimal: ContentType = {
      sys: { id: 'mini' },
      displayField: 'name',
      fields: [
        { id: 'name', name: 'Name', type: 'Symbol', localized: false, required: false },
        { id: 'foo', name: 'Foo', type: 'Number', localized: false, required: false },
      ],
    };
    expect(getSmartDefaults(minimal)).toEqual(['name']);
  });
});

describe('applyPreset', () => {
  it('essentials matches smart defaults', () => {
    expect(applyPreset(blogPost, 'essentials')).toEqual(getSmartDefaults(blogPost));
  });

  it('content includes text-based fields only', () => {
    const result = applyPreset(blogPost, 'content');
    expect(result).toContain('title');
    expect(result).toContain('slug');
    expect(result).toContain('body');
    expect(result).toContain('tags'); // Array of Symbol
    expect(result).not.toContain('author');
    expect(result).not.toContain('metadata');
  });

  it('references includes link fields only', () => {
    const result = applyPreset(blogPost, 'references');
    expect(result).toContain('author');
    expect(result).toContain('related');
    expect(result).not.toContain('title');
  });

  it('all includes every field', () => {
    expect(applyPreset(blogPost, 'all')).toHaveLength(blogPost.fields.length);
  });

  it('custom returns an empty array', () => {
    expect(applyPreset(blogPost, 'custom')).toEqual([]);
  });
});

describe('groupFields', () => {
  it('groups title, required, and optional fields', () => {
    const groups = groupFields(blogPost);
    expect(groups.map((g) => g.id)).toEqual(['title', 'required', 'optional']);
    expect(groups[0].fields[0].id).toBe('title');
    expect(groups[1].fields.map((f) => f.id)).toEqual(['slug']);
    expect(groups[2].fields.map((f) => f.id).sort()).toEqual(
      ['author', 'body', 'metadata', 'related', 'tags'].sort()
    );
  });

  it('filters fields by search term across name and id', () => {
    const groups = groupFields(blogPost, 'tag');
    const allIds = groups.flatMap((g) => g.fields.map((f) => f.id));
    expect(allIds).toEqual(['tags']);
  });

  it('hides empty groups when search filters them out', () => {
    const groups = groupFields(blogPost, 'related');
    expect(groups.find((g) => g.id === 'title')).toBeUndefined();
    expect(groups.find((g) => g.id === 'required')).toBeUndefined();
    expect(groups.find((g) => g.id === 'optional')?.fields).toHaveLength(1);
  });
});

describe('detectPreset', () => {
  it('detects essentials preset', () => {
    expect(detectPreset(blogPost, applyPreset(blogPost, 'essentials'))).toBe('essentials');
  });

  it('detects all preset', () => {
    expect(detectPreset(blogPost, applyPreset(blogPost, 'all'))).toBe('all');
  });

  it('detects references preset', () => {
    expect(detectPreset(blogPost, applyPreset(blogPost, 'references'))).toBe('references');
  });

  it('returns custom when selection does not match any preset', () => {
    expect(detectPreset(blogPost, ['title', 'metadata'])).toBe('custom');
  });
});
