import { describe, expect, it } from 'vitest';
import generateLiquidTags from './generateLiquidTags';
import { Field } from './assembleQuery';
import { BaseField, BasicField } from './field/baseField';

describe('Generate liquid tags', () => {
  it('Content type with text field transforms it into a liquid tag', () => {
    const contentTypeId = 'blogPost';
    const entryField: Field[] = [
      {
        id: 'title',
        type: 'Symbol',
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryField);

    expect(result).toContain('{{response.data.blogPost.title}}');
  });

  it('Content type with more than one basic field transforms each into liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'title',
        type: 'Symbol',
      },
      {
        id: 'number',
        type: 'Integer',
      },
      {
        id: 'date',
        type: 'Date',
      },
      {
        id: 'bool',
        type: 'Boolean',
      },
      {
        id: 'longText',
        type: 'Text',
      },
      {
        id: 'decimal',
        type: 'Number',
      },
      {
        id: 'decimal',
        type: 'Number',
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.title}}');
    expect(result).toContain('{{response.data.blogPost.number}}');
    expect(result).toContain('{{response.data.blogPost.date}}');
    expect(result).toContain('{{response.data.blogPost.bool}}');
    expect(result).toContain('{{response.data.blogPost.longText}}');
    expect(result).toContain('{{response.data.blogPost.number}}');
    expect(result).toContain('{{response.data.blogPost.decimal}}');
  });

  it('Content type with one field one that is an asset transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'asset',
        type: 'Link',
        linkType: 'Asset',
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.asset.title}}');
    expect(result).toContain('{{response.data.blogPost.asset.description}}');
    expect(result).toContain('{{response.data.blogPost.asset.url}}');
    expect(result).toContain('{{response.data.blogPost.asset.contentType}}');
    expect(result).toContain('{{response.data.blogPost.asset.fileName}}');
    expect(result).toContain('{{response.data.blogPost.asset.size}}');
    expect(result).toContain('{{response.data.blogPost.asset.width}}');
    expect(result).toContain('{{response.data.blogPost.asset.height}}');
  });

  it('Content type with one field that is a location transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'address',
        type: 'Location',
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.address.lat}}');
    expect(result).toContain('{{response.data.blogPost.address.long}}');
  });

  it('Content type with one field that is a reference to an basic entry transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'reference',
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'name',
            type: 'Symbol',
          },
          {
            id: 'phone',
            type: 'Integer',
          },
        ],
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.reference.name}}');
    expect(result).toContain('{{response.data.blogPost.reference.phone}}');
  });

  it('Content type with one field that is a reference to an asset transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'reference',
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'asset',
            type: 'Link',
            linkType: 'Asset',
          },
        ],
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.reference.asset.title}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.description}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.url}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.contentType}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.fileName}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.size}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.width}}');
    expect(result).toContain('{{response.data.blogPost.reference.asset.height}}');
  });

  it('Content type with one field that contains a reference within a reference transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'reference',
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'referenceWithinAReference',
            type: 'Link',
            linkType: 'Entry',
            entryContentType: 'reference',
            fields: [
              {
                id: 'name',
                type: 'Symbol',
              },
              {
                id: 'phone',
                type: 'Integer',
              },
            ],
          },
        ],
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.reference.referenceWithinAReference.name}}');
  });

  it('Content type with one field that contains a list of references transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: '"listOfReferences"',
        type: 'Array',
        items: [
          {
            type: 'Link',
            linkType: 'Entry',
            entryContentType: 'tag',
            fields: [
              {
                id: 'name',
                type: 'Symbol',
              },
            ],
          },
        ],
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.listOfReferencesCollection.items[0].name}}');
  });
});
