import { describe, expect, it } from 'vitest';
import { ReferenceItem } from '../../src/fields/ReferenceItem';
import { BasicField } from '../../src/fields/BasicField';

describe('ReferenceItem', () => {
  it('Generates fragment query for item', () => {
    const name = new BasicField('name', 'Name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'Phone', 'author', false);
    phone.selected = true;
    const item = new ReferenceItem(
      'idReferenceItem',
      'Blog item #1',
      'blog',
      'Title',
      false,
      'author',
      'Author',
      [name, phone]
    );
    const result = item.generateQuery();
    expect(result).toEqual('... on Author {name phone}');
  });

  it('Generates liquid tags for item', () => {
    const name = new BasicField('name', 'Name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'Phone', 'author', false);
    phone.selected = true;
    const item = new ReferenceItem(
      'idReferenceItem',
      'Blog item #1',
      'blog',
      'Title',
      false,
      'author',
      'Author',
      [name, phone]
    );
    const result = item.generateLiquidTagForType(
      'response.data.blogPost.authorsCollection.items[0]'
    );
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].name}}');
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].phone}}');
  });
});
