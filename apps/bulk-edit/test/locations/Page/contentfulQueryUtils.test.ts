import { describe, expect, it } from 'vitest';
import { fieldFilterValuesToQuery } from '../../../src/locations/Page/utils/contentfulQueryUtils';
import type { ContentTypeField, FieldFilterValue } from '../../../src/locations/Page/types';

describe('contentfulQueryUtils', () => {
  it('serializes array of symbols filters without link sys.id paths', () => {
    const tagsField: ContentTypeField = {
      contentTypeId: 'blogPost',
      id: 'tags',
      uniqueId: 'tags',
      name: 'Tags',
      type: 'Array',
      required: false,
      validations: [],
      items: {
        type: 'Symbol',
      },
    };

    const filterValue: FieldFilterValue = {
      fieldUniqueId: 'tags',
      operator: 'in',
      value: 'featured,launch',
      contentTypeField: tagsField,
    };

    expect(fieldFilterValuesToQuery([filterValue]).query).toEqual({
      'fields.tags[in]': 'featured,launch',
    });
  });

  it('serializes array of links filters using sys.id paths', () => {
    const authorsField: ContentTypeField = {
      contentTypeId: 'blogPost',
      id: 'authors',
      uniqueId: 'authors',
      name: 'Authors',
      type: 'Array',
      required: false,
      validations: [],
      items: {
        type: 'Link',
        linkType: 'Entry',
      },
    };

    const filterValue: FieldFilterValue = {
      fieldUniqueId: 'authors',
      operator: 'all',
      value: 'author-1,author-2',
      contentTypeField: authorsField,
    };

    expect(fieldFilterValuesToQuery([filterValue]).query).toEqual({
      'fields.authors.sys.id[all]': 'author-1,author-2',
    });
  });
});
