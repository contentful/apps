import { extractUrlsFromEntry, isRelativeUrl, type ExtractedUrl } from '@/utils/extractUrls';

describe('isRelativeUrl', () => {
  it('returns false for http URLs', () => {
    expect(isRelativeUrl('http://example.com')).toBe(false);
    expect(isRelativeUrl('http://example.com/path')).toBe(false);
  });

  it('returns false for https URLs', () => {
    expect(isRelativeUrl('https://example.com')).toBe(false);
    expect(isRelativeUrl('https://example.com/path')).toBe(false);
  });

  it('returns false for www URLs', () => {
    expect(isRelativeUrl('www.example.com')).toBe(false);
    expect(isRelativeUrl('www.example.com/help')).toBe(false);
  });

  it('returns true for path-only URLs', () => {
    expect(isRelativeUrl('/about')).toBe(true);
    expect(isRelativeUrl('/path/to/page')).toBe(true);
  });

  it('returns true for relative paths with . and ..', () => {
    expect(isRelativeUrl('./page')).toBe(true);
    expect(isRelativeUrl('../parent')).toBe(true);
  });

  it('handles whitespace by trimming', () => {
    expect(isRelativeUrl('  https://example.com  ')).toBe(false);
    expect(isRelativeUrl('  /about  ')).toBe(true);
  });
});

describe('extractUrlsFromEntry', () => {
  it('returns empty array for entry with no fields', () => {
    expect(extractUrlsFromEntry({ fields: {} })).toEqual([]);
  });

  it('returns empty array for Symbol field with no URLs', () => {
    const entry = {
      fields: {
        title: {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          locales: ['en-US'],
          getValue: () => 'Just plain text',
        },
      },
    };
    expect(extractUrlsFromEntry(entry)).toEqual([]);
  });

  it('extracts absolute URLs from Symbol field', () => {
    const entry = {
      fields: {
        link: {
          id: 'link',
          name: 'Link',
          type: 'Symbol',
          locales: ['en-US'],
          getValue: () => 'Visit https://example.com for more.',
        },
      },
    };
    const result = extractUrlsFromEntry(entry);
    expect(result).toHaveLength(1);
    expect(result[0].url).toMatch(/example\.com/);
    expect(result[0].fieldId).toBe('link');
    expect(result[0].fieldName).toBe('Link');
    expect(result[0].locale).toBe('en-US');
  });

  it('extracts relative paths when present', () => {
    const entry = {
      fields: {
        body: {
          id: 'body',
          name: 'Body',
          type: 'Text',
          locales: ['en-US'],
          getValue: () => 'See /about and ./faq for details.',
        },
      },
    };
    const result = extractUrlsFromEntry(entry);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const urls = result.map((r) => r.url);
    expect(urls.some((u) => u === '/about' || u.startsWith('/about'))).toBe(true);
  });

  it('normalizes www URLs to https URLs during extraction', () => {
    const entry = {
      fields: {
        body: {
          id: 'body',
          name: 'Body',
          type: 'Text',
          locales: ['en-US'],
          getValue: () => 'Visit www.example.com/help for more details.',
        },
      },
    };

    expect(extractUrlsFromEntry(entry).map((result) => result.url)).toEqual([
      'https://www.example.com/help',
    ]);
  });

  it('strips trailing punctuation from absolute URLs in prose', () => {
    const entry = {
      fields: {
        body: {
          id: 'body',
          name: 'Body',
          type: 'Text',
          locales: ['en-US'],
          getValue: () => 'See https://example.com. Then visit https://example.com/docs, too.',
        },
      },
    };

    expect(extractUrlsFromEntry(entry).map((result) => result.url)).toEqual([
      'https://example.com',
      'https://example.com/docs',
    ]);
  });

  it('strips trailing punctuation from relative URLs in prose', () => {
    const entry = {
      fields: {
        body: {
          id: 'body',
          name: 'Body',
          type: 'Text',
          locales: ['en-US'],
          getValue: () => 'Review /about. Then check ../team/contact).',
        },
      },
    };

    expect(extractUrlsFromEntry(entry).map((result) => result.url)).toEqual([
      '/about',
      '../team/contact',
    ]);
  });

  it('deduplicates same URL in same field/locale', () => {
    const entry = {
      fields: {
        links: {
          id: 'links',
          name: 'Links',
          type: 'Text',
          locales: ['en-US'],
          getValue: () => 'https://example.com and https://example.com again',
        },
      },
    };
    const result = extractUrlsFromEntry(entry);
    expect(result).toHaveLength(1);
  });

  it('does not treat plain email addresses as URLs', () => {
    const entry = {
      fields: {
        replyToEmail: {
          id: 'replyToEmail',
          name: 'Reply-to email',
          type: 'Symbol',
          locales: ['en-US'],
          getValue: () => 'hello@colorful.com',
        },
      },
    };

    expect(extractUrlsFromEntry(entry)).toEqual([]);
  });

  it('includes Rich Text hyperlink URIs', () => {
    const entry = {
      fields: {
        content: {
          id: 'content',
          name: 'Content',
          type: 'RichText',
          locales: ['en-US'],
          getValue: () => ({
            nodeType: 'document',
            content: [
              {
                nodeType: 'paragraph',
                content: [
                  {
                    nodeType: 'hyperlink',
                    data: { uri: 'https://contentful.com' },
                    content: [{ nodeType: 'text', value: 'Contentful' }],
                  },
                ],
              },
            ],
          }),
        },
      },
    };
    const result = extractUrlsFromEntry(entry);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://contentful.com');
    expect(result[0].fieldId).toBe('content');
  });

  it('ignores non-String non-RichText fields', () => {
    const entry = {
      fields: {
        number: {
          id: 'number',
          name: 'Number',
          type: 'Number',
          locales: ['en-US'],
          getValue: () => 42,
        },
      },
    };
    expect(extractUrlsFromEntry(entry)).toEqual([]);
  });

  describe('List (multivalue) fields', () => {
    it('extracts URLs from List field (array of strings)', () => {
      const entry = {
        fields: {
          links: {
            id: 'links',
            name: 'Links',
            type: 'Array',
            locales: ['en-US'],
            getValue: () => [
              'First: https://first.com',
              'Second: https://second.com',
              'Third: see /about',
            ],
          },
        },
      };
      const result = extractUrlsFromEntry(entry);
      expect(result).toHaveLength(3);
      const urls = result.map((r) => r.url);
      expect(urls).toContain('https://first.com');
      expect(urls).toContain('https://second.com');
      expect(urls.some((u) => u === '/about' || u.startsWith('/about'))).toBe(true);
      result.forEach((r) => {
        expect(r.fieldId).toBe('links');
        expect(r.fieldName).toBe('Links');
        expect(r.locale).toBe('en-US');
      });
    });

    it('deduplicates same URL across items in same List field', () => {
      const entry = {
        fields: {
          links: {
            id: 'links',
            name: 'Links',
            type: 'Array',
            locales: ['en-US'],
            getValue: () => ['https://example.com', 'Check https://example.com too'],
          },
        },
      };
      const result = extractUrlsFromEntry(entry);
      expect(result).toHaveLength(1);
      expect(result[0].url).toMatch(/example\.com/);
    });

    it('skips non-string items in List field', () => {
      const entry = {
        fields: {
          mixed: {
            id: 'mixed',
            name: 'Mixed',
            type: 'Array',
            locales: ['en-US'],
            getValue: () =>
              ['https://valid.com', null, 42, undefined, 'https://also-valid.com'] as unknown[],
          },
        },
      };
      const result = extractUrlsFromEntry(entry);
      expect(result).toHaveLength(2);
      const urls = result.map((r) => r.url);
      expect(urls).toContain('https://valid.com');
      expect(urls).toContain('https://also-valid.com');
    });

    it('returns empty array for List field with no URLs', () => {
      const entry = {
        fields: {
          labels: {
            id: 'labels',
            name: 'Labels',
            type: 'Array',
            locales: ['en-US'],
            getValue: () => ['Label A', 'Label B'],
          },
        },
      };
      expect(extractUrlsFromEntry(entry)).toEqual([]);
    });

    it('does not treat a standalone slash separator as a relative link', () => {
      const entry = {
        fields: {
          title: {
            id: 'title',
            name: 'Title',
            type: 'Symbol',
            locales: ['en-US'],
            getValue: () => 'Partners / More customers',
          },
        },
      };

      expect(extractUrlsFromEntry(entry)).toEqual([]);
    });
  });
});
