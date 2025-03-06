import { describe, expect, it } from 'vitest';
import generateLiquidTags from './generateLiquidTags';
import { Field } from '../dialogaux';

describe('Generate liquid tags', () => {
  it('Content type with text field transforms it into a liquid tag', () => {
    const contentTypeId = 'blogPost';
    const entryField: Field = {
      id: 'title',
      type: 'Symbol',
    };

    const result = generateLiquidTags(contentTypeId, entryField);

    expect(result).toEqual('{{response.data.blogPost.title}}');
  });
});
