import { describe, expect, it } from 'vitest';
import { ReferenceItem } from '../../src/fields/ReferenceItem';
import { BasicField } from '../../src/fields/BasicField';

describe('ReferenceItem', () => {
  it('Generates fragment query for item', () => {
    const name = new BasicField('name', 'author', false);
    const phone = new BasicField('phone', 'author', false);
    const item = new ReferenceItem('author', [name, phone]);
    const result = item.generateQuery();
    expect(result).toEqual('... on Author {name phone}');
  });

  it('Generates liquid tags for item', () => {
    const name = new BasicField('name', 'author', false);
    const phone = new BasicField('phone', 'author', false);
    const item = new ReferenceItem('author', [name, phone]);
    const result = item.generateLiquidTagForType(
      'response.data.blogPost.authorsCollection.items[0]'
    );
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].name}}');
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].phone}}');
  });
});
