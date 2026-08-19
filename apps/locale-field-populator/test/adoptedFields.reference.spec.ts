// adoptedFields.reference.spec.ts
//
// Proof-of-concept coverage for CCS-3539: reference fields (single Link and
// Array-of-Link) must be selectable/adoptable like any other localized field.
// This exercises the field-selection helpers directly rather than mounting
// the full Dialog flow, since the behavior under test is "which fields does
// the app consider copyable", not full UI orchestration.
import { describe, it, expect } from 'vitest';
import { ContentTypeProps } from 'contentful-management';
import {
  hasAnyAdoptedFields,
  setAllEntryFieldsAdopted,
  setFieldAdopted,
} from '../src/utils/adoptedFields';

const contentTypeWithReferenceFields: ContentTypeProps = {
  sys: { id: 'article', type: 'ContentType' },
  name: 'Article',
  displayField: 'title',
  fields: [
    { id: 'title', name: 'Title', type: 'Symbol', localized: true },
    {
      id: 'relatedArticle',
      name: 'Related Article',
      type: 'Link',
      linkType: 'Entry',
      localized: true,
    },
    {
      id: 'relatedArticles',
      name: 'Related Articles',
      type: 'Array',
      items: { type: 'Link', linkType: 'Entry' },
      localized: true,
    },
    { id: 'internalNote', name: 'Internal Note', type: 'Symbol', localized: false },
  ],
} as unknown as ContentTypeProps;

describe('adoptedFields: reference field selection (CCS-3539)', () => {
  it('setAllEntryFieldsAdopted marks localized reference fields as adopted', () => {
    const localizedFieldIds = contentTypeWithReferenceFields.fields
      .filter((f) => f.localized)
      .map((f) => f.id);

    const result = setAllEntryFieldsAdopted({}, 'entry-1', localizedFieldIds, true);

    expect(result['entry-1']).toEqual({
      title: true,
      relatedArticle: true,
      relatedArticles: true,
    });
    // Non-localized fields have exactly one value across all locales by
    // definition -- there's nothing to copy, so they should never appear.
    expect(result['entry-1']).not.toHaveProperty('internalNote');
  });

  it('setFieldAdopted toggles a single reference field independently of other fields', () => {
    const initial = setAllEntryFieldsAdopted(
      {},
      'entry-1',
      ['title', 'relatedArticle', 'relatedArticles'],
      true
    );

    const result = setFieldAdopted(initial, 'entry-1', 'relatedArticle', false);

    expect(result['entry-1']).toEqual({
      title: true,
      relatedArticle: false,
      relatedArticles: true,
    });
  });

  it('hasAnyAdoptedFields is true when only a reference field is adopted', () => {
    const map = setFieldAdopted({}, 'entry-1', 'relatedArticle', true);

    expect(hasAnyAdoptedFields(map)).toBe(true);
  });

  it('hasAnyAdoptedFields is false when a reference field is explicitly not adopted', () => {
    const map = setFieldAdopted({}, 'entry-1', 'relatedArticle', false);

    expect(hasAnyAdoptedFields(map)).toBe(false);
  });
});
