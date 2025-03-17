import { describe, expect, it } from 'vitest';
import { BasicArrayField } from '../../src/fields/BasicArrayField';

describe('BasicArrayField', () => {
  it('Generates query', () => {
    const field = new BasicArrayField('words', 'blogPost', false);
    const result = field.generateQuery();
    expect(result).toEqual('words');
  });

  it('Generates liquid tag', () => {
    const field = new BasicArrayField('words', 'blogPost', false);
    const result = field.generateLiquidTag();
    expect(result).toEqual([
      '{% for wordsItem in response.data.blogPost.words %}\n' +
        '  {{ wordsItem }}\n' +
        '{% endfor %}',
    ]);
  });
});
