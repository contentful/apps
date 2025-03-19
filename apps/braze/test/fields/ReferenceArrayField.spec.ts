import { describe, expect, it, vi } from 'vitest';
import { ReferenceArrayField } from '../../src/fields/ReferenceArrayField';
import { ReferenceItem } from '../../src/fields/ReferenceItem';
import { BasicField } from '../../src/fields/BasicField';

describe('ReferenceArrayField', () => {
  it('Generates query', () => {
    const name = new BasicField('name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'author', false);
    phone.selected = true;
    const item = new ReferenceItem('[0]', 'blog', false, 'author', [name, phone]);
    item.selected = true;
    const field = new ReferenceArrayField('authors', 'blogPost', false, [item]);
    const result = field.generateQuery();
    expect(result).toEqual('authorsCollection {items {... on Author {name phone}}}');
  });

  it('Generates liquid tags', () => {
    const name = new BasicField('name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'author', false);
    phone.selected = true;
    const item = new ReferenceItem('[0]', 'blog', false, 'author', [name, phone]);
    item.selected = true;
    const field = new ReferenceArrayField('authors', 'blogPost', false, [item]);
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].name}}');
    expect(result).toContain('{{response.data.blogPost.authorsCollection.items[0].phone}}');
  });
});
