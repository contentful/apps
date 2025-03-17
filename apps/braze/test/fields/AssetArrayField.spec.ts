import { describe, expect, it } from 'vitest';
import { AssetArrayField } from '../../src/fields/AssetArrayField';
import { ASSET_FIELDS_QUERY } from '../../src/helpers/utils';

describe('AssetArrayField', () => {
  it('Generates query', () => {
    const field = new AssetArrayField('headers', 'blogPost', false);
    const result = field.generateQuery();
    expect(result).toEqual(`headersCollection {items {${ASSET_FIELDS_QUERY}}}`);
  });

  it('Generates liquid tag for symbol', () => {
    const field = new AssetArrayField('headers', 'blogPost', false);
    const result = field.generateLiquidTag();
    expect(result).toEqual([
      `
      {% for headersCollectionItem in response.data.blogPost.headersCollection.items %}
        {{ headersCollectionItem.title }}
{{ headersCollectionItem.description }}
{{ headersCollectionItem.url }}
      {% endfor %}`,
    ]);
  });
});
