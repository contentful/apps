import { describe, expect, it } from 'vitest';
import generateLiquidTags from './generateLiquidTags';
import { Field } from '../dialogaux';

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

  it('Content type with more than one basic field transforms both into a liquid tags', () => {
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

  it('Content type with more than one field including one that is an asset transforms both into a liquid tags', () => {
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

  it('Content type with more than one field including one that is a location transforms both into a liquid tags', () => {
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

  it('Content type with more than one field including one that is a list of text transforms both into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'list',
        type: 'Array',
        items: {
          type: 'Symbol'
        }
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.list.lat}}');
    expect(result).toContain('{{response.data.blogPost.list.long}}');
  });
});
