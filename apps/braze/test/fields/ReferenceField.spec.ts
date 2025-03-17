import { describe, expect, it } from 'vitest';
import { ReferenceField } from '../../src/fields/ReferenceField';
import { BasicField } from '../../src/fields/BasicField';
import { AssetField } from '../../src/fields/AssetField';
import { ASSET_FIELDS_QUERY } from '../../src/helpers/utils';

describe('ReferenceField', () => {
  it('Generates query for reference with baic fields', () => {
    const name = new BasicField('name', 'author', false, 'Symbol');
    const phone = new BasicField('phone', 'author', false, 'Number');
    const field = new ReferenceField('author', 'blogPost', false, 'author', [name, phone]);
    const result = field.generateQuery();
    expect(result).toEqual('author {... on Author {name phone}}');
  });

  it('Generates query for reference with asset', () => {
    const image = new AssetField('image', 'author', false);
    const field = new ReferenceField('author', 'blogPost', false, 'author', [image]);
    const result = field.generateQuery();
    expect(result).toEqual(`author {... on Author {image {${ASSET_FIELDS_QUERY.join(' ')}}}}`);
  });

  it('Generates query for reference within a reference', () => {
    const book = new BasicField('name', 'book', false, 'Symbol');
    const nestedReference = new ReferenceField('book', 'author', false, 'book', [book]);
    const field = new ReferenceField('author', 'blogPost', false, 'author', [nestedReference]);
    const result = field.generateQuery();
    expect(result).toEqual('author {... on Author {book {... on Book {name}}}}');
  });

  it('Generates liquid tag for reference with basic fields', () => {
    const name = new BasicField('name', 'author', false, 'Symbol');
    const phone = new BasicField('phone', 'author', false, 'Number');
    const field = new ReferenceField('author', 'blogPost', false, 'author', [name, phone]);
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.author.name}}');
    expect(result).toContain('{{response.data.blogPost.author.phone}}');
  });

  it('Generates liquid tag for reference with asset', () => {
    const image = new AssetField('image', 'author', false);
    const field = new ReferenceField('author', 'blogPost', false, 'author', [image]);
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.author.image.title}}');
    expect(result).toContain('{{response.data.blogPost.author.image.description}}');
    expect(result).toContain('{{response.data.blogPost.author.image.url}}');
  });

  it('Generates liquid tag for reference within a reference', () => {
    const book = new BasicField('name', 'book', false, 'Symbol');
    const nestedReference = new ReferenceField('book', 'author', false, 'author', [book]);
    const field = new ReferenceField('author', 'blogPost', false, 'author', [nestedReference]);
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.author.book.name}}');
  });
});
