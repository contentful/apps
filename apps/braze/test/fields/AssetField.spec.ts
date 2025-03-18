import { describe, expect, it } from 'vitest';
import { AssetField } from '../../src/fields/AssetField';
import { ASSET_FIELDS_QUERY } from '../../src/utils';

describe('AssetField', () => {
  it('Generates query', () => {
    const field = new AssetField('header', 'blogPost', false);
    const result = field.generateQuery();
    expect(result).toEqual(`header {${ASSET_FIELDS_QUERY.join(' ')}}`);
  });

  it('Generates liquid tag', () => {
    const field = new AssetField('header', 'blogPost', false);
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.header.title}}');
    expect(result).toContain('{{response.data.blogPost.header.description}}');
    expect(result).toContain('{{response.data.blogPost.header.url}}');
  });
});
