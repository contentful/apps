import { describe, expect, it } from 'vitest';
import type { ComponentPropertyDescriptor } from '@contentful/app-sdk';
import { suggestMetaFromHeading } from './fixes';
import type { CollectedNode } from './types';

function node(properties: ComponentPropertyDescriptor[]): CollectedNode {
  return { id: 'n', nodeType: 'Component', properties };
}

describe('suggestMetaFromHeading', () => {
  it('proposes the heading text as the meta value', () => {
    const result = suggestMetaFromHeading(
      node([
        { key: 'heading', area: 'content', value: '  Our Spring Sale  ' },
        { key: 'metaTitle', area: 'content', value: '' },
      ])
    );
    expect(result).toBe('Our Spring Sale');
  });

  it('returns null when there is no non-empty heading', () => {
    const result = suggestMetaFromHeading(
      node([
        { key: 'heading', area: 'content', value: '   ' },
        { key: 'metaTitle', area: 'content', value: '' },
      ])
    );
    expect(result).toBeNull();
  });

  it('returns null when the heading is not a string', () => {
    const result = suggestMetaFromHeading(
      node([
        { key: 'heading', area: 'content', value: { sys: { id: 'x' } } },
        { key: 'metaTitle', area: 'content', value: '' },
      ])
    );
    expect(result).toBeNull();
  });
});
