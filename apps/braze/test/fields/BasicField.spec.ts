import { describe, expect, it } from 'vitest';
import { BasicField } from '../../src/fields/BasicField';

describe('BasicField', () => {
  it('Generates query', () => {
    const field = new BasicField('title', 'Title', 'blogPost', false);
    const result = field.generateQuery();
    expect(result).toEqual('title');
  });

  it('Generates liquid tag', () => {
    const field = new BasicField('title', 'Title', 'blogPost', false);
    const result = field.generateLiquidTag();
    expect(result).toEqual(['{{response.data.blogPost.title}}']);
  });
});
