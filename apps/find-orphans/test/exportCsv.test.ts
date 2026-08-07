import { describe, expect, it } from 'vitest';
import { buildOrphanCsv, editorUrl } from '../src/locations/Page/utils/exportCsv';
import { OrphanResult } from '../src/locations/Page/types';

const context = { spaceId: 'space-id', environmentId: 'master' };

const makeResult = (overrides: Partial<OrphanResult> = {}): OrphanResult => ({
  kind: 'entry',
  id: 'entry-1',
  typeName: 'Article',
  title: undefined,
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'Jane Doe',
  neverEdited: true,
  ...overrides,
});

describe('editorUrl', () => {
  it('routes entries and assets to their separate editor paths', () => {
    expect(editorUrl(makeResult(), context)).toBe(
      'https://app.contentful.com/spaces/space-id/environments/master/entries/entry-1'
    );
    expect(editorUrl(makeResult({ kind: 'asset', id: 'asset-1' }), context)).toBe(
      'https://app.contentful.com/spaces/space-id/environments/master/assets/asset-1'
    );
  });
});

describe('buildOrphanCsv', () => {
  it('writes a header row plus one CRLF-separated row per result', () => {
    const csv = buildOrphanCsv(
      [makeResult(), makeResult({ id: 'entry-2', neverEdited: false })],
      context
    );
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    // "Edited after creation", not "Never edited": the positive phrasing
    // avoids double-negative cells ("Never edited: no").
    expect(lines[0]).toBe('Kind,ID,Title,Type,Created,Created by,Edited after creation,Editor URL');
    expect(lines[1]).toBe(
      'entry,entry-1,,Article,2026-01-01T00:00:00Z,Jane Doe,no,' +
        'https://app.contentful.com/spaces/space-id/environments/master/entries/entry-1'
    );
    expect(lines[2]).toContain(',yes,');
  });

  it('leaves missing titles as empty cells so spreadsheet blank-filters match them', () => {
    const csv = buildOrphanCsv([makeResult({ title: undefined })], context);
    expect(csv.split('\r\n')[1].startsWith('entry,entry-1,,Article')).toBe(true);
    expect(csv).not.toContain('Untitled');
  });

  it('quotes cells containing commas, quotes, or newlines per RFC 4180', () => {
    const csv = buildOrphanCsv([makeResult({ title: 'Hello, "World"\nSecond line' })], context);
    expect(csv).toContain('"Hello, ""World""\nSecond line"');
  });

  it('neutralizes leading formula characters so Excel treats them as text', () => {
    // Titles are content-controlled: a title like =HYPERLINK(...) would
    // execute as a formula when the CSV is opened, so it gets the
    // literal-text apostrophe prefix.
    const csv = buildOrphanCsv([makeResult({ title: '=HYPERLINK("http://evil")' })], context);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});
