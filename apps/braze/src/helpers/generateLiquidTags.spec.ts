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
  it('Content type with more than one field transforms both into a liquid tags', () => {
    const contentTypeId = 'blogPost';
    const entryFields: Field[] = [
      {
        id: 'title',
        type: 'Symbol',
      },
      {
        id: 'body',
        type: 'Symbol',
      },
    ];

    const result = generateLiquidTags(contentTypeId, entryFields);

    expect(result).toContain('{{response.data.blogPost.title}}');
    expect(result).toContain('{{response.data.blogPost.body}}');
  });
});
