import { describe, expect, it } from 'vitest';
import { BasicField } from '../../src/fields/BasicField';

describe('BasicField', () => {
  it('Generates query for Symbol', () => {
    const field = new BasicField('title', 'blogPost', false, 'Symbol');
    const result = field.generateQuery();
    expect(result).toEqual('title');
  });

  it('Generates query for Location', () => {
    const field = new BasicField('address', 'blogPost', false, 'Location');
    const result = field.generateQuery();
    expect(result).toEqual('address {lat lon}');
  });

  it('Generates query for RichText', () => {
    const field = new BasicField('body', 'blogPost', false, 'RichText');
    const result = field.generateQuery();
    expect(result).toEqual('');
  });

  it('Generates liquid tag for symbol', () => {
    const field = new BasicField('title', 'blogPost', false, 'Symbol');
    const result = field.generateLiquidTag();
    expect(result).toEqual(['{{response.data.blogPost.title}}']);
  });

  it('Generates liquid tag for location', () => {
    const field = new BasicField('address', 'blogPost', false, 'Location');
    const result = field.generateLiquidTag();
    expect(result).toEqual([
      '{{response.data.blogPost.address.lat}}',
      '{{response.data.blogPost.address.lon}}',
    ]);
  });
});
