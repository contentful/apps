import { describe, expect, it } from 'vitest';
import generateLiquidTags from './generateLiquidTags';
import { Field } from './assembleQuery';

describe('Generate liquid tags', () => {
  it('Content type with text field transforms it into a liquid tag', () => {
    const contentTypeId = 'blogPost';
    const entryField: Field[] = [
      {
        id: 'title',
        localized: false,
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
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'number',
        localized: false,
        type: 'Integer',
      },
      {
        id: 'date',
        localized: false,
        type: 'Date',
      },
      {
        id: 'bool',
        localized: false,
        type: 'Boolean',
      },
      {
        id: 'longText',
        localized: false,
        type: 'Text',
      },
      {
        id: 'decimal',
        localized: false,
        type: 'Number',
      },
      {
        id: 'decimal',
        localized: false,
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
        localized: false,
        type: 'Link',
        linkType: 'Asset',
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.asset.title}}');
    expect(result).toContain('{{response.data.blogPost.asset.description}}');
    expect(result).toContain('{{response.data.blogPost.asset.url}}');
  });

  it('Content type with one field that is a location transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'address',
        localized: false,
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
        localized: false,
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'name',
            localized: false,
            type: 'Symbol',
          },
          {
            id: 'phone',
            localized: false,
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
        localized: false,
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'asset',
            localized: false,
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
  });

  it('Content type with one field that contains a reference within a reference transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'reference',
        localized: false,
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'referenceWithinAReference',
            localized: false,
            type: 'Link',
            linkType: 'Entry',
            entryContentType: 'reference',
            fields: [
              {
                id: 'name',
                localized: false,
                type: 'Symbol',
              },
              {
                id: 'phone',
                localized: false,
                type: 'Integer',
              },
            ],
          },
        ],
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.reference.referenceWithinAReference.name}}');
    expect(result).toContain(
      '{{response.data.blogPost.reference.referenceWithinAReference.phone}}'
    );
  });

  it('Content type with one field that contains a list of text transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'listOfText',
        localized: false,
        type: 'Array',
        arrayType: 'Symbol',
        items: {
          type: 'Symbol',
        },
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain(
      `{% for listOfTextItem in response.data.blogPost.listOfText %}\n{{ listOfTextItem }}\n{% endfor %}`
    );
  });

  it('Content type with one field that contains a list of references transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'listOfReferences',
        localized: false,
        type: 'Array',
        arrayType: 'Entry',
        items: [
          {
            type: 'Link',
            linkType: 'Entry',
            entryContentType: 'tag',
            fields: [
              {
                id: 'name',
                localized: false,
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

  it('Content type with one field that contains a list of assets transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'listOfAsset',
        localized: false,
        type: 'Array',
        arrayType: 'Asset',
        items: {
          type: 'Link',
          linkType: 'Asset',
        },
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain(
      `{% for listOfAssetCollectionItem in response.data.blogPost.listOfAssetCollection.items %}\n{{ listOfAssetCollectionItem.title }}\n{{ listOfAssetCollectionItem.description }}\n{{ listOfAssetCollectionItem.url }}\n{% endfor %}`
    );
  });

  it('Content type with one field that contains a reference within a reference whitin another reference transforms into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'reference',
        localized: false,
        type: 'Link',
        linkType: 'Entry',
        entryContentType: 'reference',
        fields: [
          {
            id: 'referenceWithinAReference',
            localized: false,
            type: 'Link',
            linkType: 'Entry',
            entryContentType: 'reference',
            fields: [
              {
                id: 'referenceWithAnotherAReference',
                localized: false,
                type: 'Link',
                linkType: 'Entry',
                entryContentType: 'reference',
                fields: [
                  {
                    id: 'name',
                    localized: false,
                    type: 'Symbol',
                  },
                  {
                    id: 'phone',
                    localized: false,
                    type: 'Integer',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain(
      '{{response.data.blogPost.reference.referenceWithinAReference.referenceWithAnotherAReference.name}}'
    );
  });
});
