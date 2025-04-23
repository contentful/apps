import { describe, expect, it } from 'vitest';
import { ReferenceArrayField } from '../../src/fields/ReferenceArrayField';
import { ReferenceItem } from '../../src/fields/ReferenceItem';
import { BasicField } from '../../src/fields/BasicField';

describe('ReferenceArrayField', () => {
  it('Generates query', () => {
    const name = new BasicField('name', 'Name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'Phone', 'author', false);
    phone.selected = true;
    const item = new ReferenceItem(
      'idReferenceItem',
      'Authors item #0',
      'blog',
      'Title',
      false,
      'author',
      'Author',
      [name, phone]
    );
    item.selected = true;
    const field = new ReferenceArrayField('authors', 'Authors', 'blogPost', false, [item]);
    const result = field.generateQuery();
    expect(result).toEqual('authorsCollection {items {... on Author {name phone}}}');
  });

  it('Generates liquid tags', () => {
    const name = new BasicField('name', 'Name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'Phone', 'author', false);
    phone.selected = true;
    const item = new ReferenceItem(
      'idReferenceItem',
      'Authors item #0',
      'blog',
      'Title',
      false,
      'author',
      'Author',
      [name, phone]
    );
    item.selected = true;
    const field = new ReferenceArrayField('authors', 'Authors', 'blogPost', false, [item]);
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].name}}');
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].phone}}');
  });
});
