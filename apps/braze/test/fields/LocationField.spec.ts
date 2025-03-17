import { describe, expect, it } from 'vitest';
import { LocationField } from '../../src/fields/LocationField';

describe('LocationField', () => {
  it('Generates query', () => {
    const field = new LocationField('address', 'blogPost', false);
    const result = field.generateQuery();
    expect(result).toEqual('address {lat lon}');
  });

  it('Generates liquid tag', () => {
    const field = new LocationField('address', 'blogPost', false);
    const result = field.generateLiquidTag();
    expect(result).toEqual([
      '{{response.data.blogPost.address.lat}}',
      '{{response.data.blogPost.address.lon}}',
    ]);
  });
});
