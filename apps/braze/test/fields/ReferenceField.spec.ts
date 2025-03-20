import { describe, expect, it } from 'vitest';
import { ReferenceField } from '../../src/fields/ReferenceField';
import { BasicField } from '../../src/fields/BasicField';
import { AssetField } from '../../src/fields/AssetField';
import { ASSET_FIELDS_QUERY } from '../../src/utils';

describe('ReferenceField', () => {
  it('Generates query for reference with baic fields', () => {
    const name = new BasicField('name', 'Name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'Phone', 'author', false);
    phone.selected = true;
    const field = new ReferenceField(
      'author',
      'Author',
      'blogPost',
      'Title',
      false,
      'author',
      'Author',
      [name, phone]
    );
    const result = field.generateQuery();
    expect(result).toEqual('author {... on Author {name phone}}');
  });

  it('Generates query for reference with asset', () => {
    const image = new AssetField('image', 'Image', 'author', false);
    image.selected = true;
    const field = new ReferenceField(
      'author',
      'Author',
      'blogPost',
      'Title',
      false,
      'author',
      'Author',
      [image]
    );
    const result = field.generateQuery();
    expect(result).toEqual(`author {... on Author {image {${ASSET_FIELDS_QUERY.join(' ')}}}}`);
  });

  it('Generates query for reference within a reference', () => {
    const book = new BasicField('name', 'Name', 'book', false);
    book.selected = true;
    const nestedReference = new ReferenceField(
      'book',
      'Book',
      'author',
      'Title',
      false,
      'book',
      'Book',
      [book]
    );
    nestedReference.selected = true;
    const field = new ReferenceField(
      'author',
      'Author',
      'blogPost',
      'Title',
      false,
      'author',
      'Author',
      [nestedReference]
    );
    const result = field.generateQuery();
    expect(result).toEqual('author {... on Author {book {... on Book {name}}}}');
  });

  it('Generates liquid tag for reference with basic fields', () => {
    const name = new BasicField('name', 'Name', 'author', false);
    name.selected = true;
    const phone = new BasicField('phone', 'Phone', 'author', false);
    phone.selected = true;
    const field = new ReferenceField(
      'author',
      'Author',
      'blogPost',
      'Title',
      false,
      'author',
      'Author',
      [name, phone]
    );
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.author.name}}');
    expect(result).toContain('{{response.data.blogPost.author.phone}}');
  });

  it('Generates liquid tag for reference with asset', () => {
    const image = new AssetField('image', 'Image', 'author', false);
    image.selected = true;
    const field = new ReferenceField(
      'author',
      'Author',
      'blogPost',
      'Title',
      false,
      'author',
      'Author',
      [image]
    );
    field.selected = true;
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.author.image.title}}');
    expect(result).toContain('{{response.data.blogPost.author.image.description}}');
    expect(result).toContain('{{response.data.blogPost.author.image.url}}');
  });

  it('Generates liquid tag for reference within a reference', () => {
    const book = new BasicField('name', 'Name', 'book', false);
    book.selected = true;
    const nestedReference = new ReferenceField(
      'book',
      'Book',
      'author',
      'Title',
      false,
      'author',
      'Author',
      [book]
    );
    nestedReference.selected = true;
    const field = new ReferenceField(
      'author',
      'Author',
      'blogPost',
      'Title',
      false,
      'author',
      'Author',
      [nestedReference]
    );
    const result = field.generateLiquidTag();
    expect(result).toContain('{{response.data.blogPost.author.book.name}}');
  });
});
