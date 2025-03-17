import { describe, it, expect, vi } from 'vitest';
import { assembleQuery } from '../../src/helpers/assembleQuery';
import { BasicField } from '../../src/fields/BasicField';

describe('assembleQuery', () => {
  it('should create a valid GraphQL query with one basic field', () => {
    const field = new BasicField('title', 'Article', false, 'Symbol');

    const contentTypeId = 'article';
    const entryId = 'abc123';
    const result = assembleQuery(contentTypeId, entryId, [field]);

    expect(result).toEqual(`{"query":"{article(id:\\"abc123\\"){title}}"}`);
  });
});
