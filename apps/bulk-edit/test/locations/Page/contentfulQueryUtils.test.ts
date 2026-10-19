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

  describe('non-localized fields', () => {
    const buildField = (
      id: string,
      type: string,
      items?: ContentTypeField['items']
    ): ContentTypeField => ({
      contentTypeId: 'blogPost',
      id,
      uniqueId: id,
      name: id,
      type,
      required: false,
      validations: [],
      items,
    });

    const buildFilter = (
      field: ContentTypeField,
      operator: FieldFilterValue['operator'],
      value: FieldFilterValue['value']
    ): FieldFilterValue => ({
      fieldUniqueId: field.uniqueId,
      operator,
      value,
      contentTypeField: field,
    });

    it('serializes a Symbol match filter', () => {
      const field = buildField('title', 'Symbol');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'match', 'hello')]).query).toEqual({
        'fields.title[match]': 'hello',
      });
    });

    it('serializes an Integer gt filter', () => {
      const field = buildField('views', 'Integer');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'gt', '10')]).query).toEqual({
        'fields.views[gt]': '10',
      });
    });

    it('serializes a Number in filter by joining an array value with commas', () => {
      const field = buildField('price', 'Number');
      const arrayValue = ['1.5', '2.5'] as unknown as string;

      expect(fieldFilterValuesToQuery([buildFilter(field, 'in', arrayValue)]).query).toEqual({
        'fields.price[in]': '1.5,2.5',
      });
    });

    it('serializes a RichText match filter', () => {
      const field = buildField('body', 'RichText');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'match', 'lorem')]).query).toEqual({
        'fields.body[match]': 'lorem',
      });
    });

    it('serializes a Link ne filter using a sys.id path', () => {
      const field = buildField('author', 'Link');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'ne', 'author-1')]).query).toEqual({
        'fields.author.sys.id[ne]': 'author-1',
      });
    });

    it('serializes exists and not exists for a Symbol', () => {
      const field = buildField('title', 'Symbol');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'exists', null)]).query).toEqual({
        'fields.title[exists]': 'true',
      });
      expect(fieldFilterValuesToQuery([buildFilter(field, 'not exists', null)]).query).toEqual({
        'fields.title[exists]': 'false',
      });
    });

    it('serializes exists and not exists for a Link using a sys.id path', () => {
      const field = buildField('author', 'Link');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'exists', null)]).query).toEqual({
        'fields.author.sys.id[exists]': 'true',
      });
      expect(fieldFilterValuesToQuery([buildFilter(field, 'not exists', null)]).query).toEqual({
        'fields.author.sys.id[exists]': 'false',
      });
    });

    it('serializes exists and not exists for an Array of Links using a sys.id path', () => {
      const field = buildField('authors', 'Array', { type: 'Link', linkType: 'Entry' });

      expect(fieldFilterValuesToQuery([buildFilter(field, 'exists', null)]).query).toEqual({
        'fields.authors.sys.id[exists]': 'true',
      });
      expect(fieldFilterValuesToQuery([buildFilter(field, 'not exists', null)]).query).toEqual({
        'fields.authors.sys.id[exists]': 'false',
      });
    });

    it('skips a filter with an empty value', () => {
      const field = buildField('title', 'Symbol');

      expect(fieldFilterValuesToQuery([buildFilter(field, 'match', '')]).query).toEqual({});
      expect(fieldFilterValuesToQuery([buildFilter(field, 'match', null)]).query).toEqual({});
    });
  });
});
