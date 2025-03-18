import { describe, expect, it } from 'vitest';
import { TextArrayField } from '../../src/fields/TextArrayField';

describe('TextArrayField', () => {
  it('Generates query', () => {
    const field = new TextArrayField('words', 'blogPost', false);
    const result = field.generateQuery();
    expect(result).toEqual('words');
  });

  it('Generates liquid tag', () => {
    const field = new TextArrayField('words', 'blogPost', false);
    const result = field.generateLiquidTag();
    expect(result).toEqual([
      '{% for wordsItem in response.data.blogPost.words %}\n' +
        '  {{ wordsItem }}\n' +
        '{% endfor %}',
    ]);
  });
});
