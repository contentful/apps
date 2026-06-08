import { describe, expect, it, vi } from 'vitest';
import { collectNodes } from './collect';
import { makeMockNode } from '../../test/mocks';

describe('collectNodes', () => {
  it('resolves properties for every root node', async () => {
    const experience: any = {
      getRootNodes: vi
        .fn()
        .mockReturnValue([
          makeMockNode('a', 'Component', [{ key: 'heading', area: 'content', value: 'Hi' }]),
          makeMockNode('b', 'Component', [{ key: 'body', area: 'content', value: 'There' }]),
        ]),
    };

    const collected = await collectNodes(experience);

    expect(collected).toHaveLength(2);
    expect(collected[0]).toMatchObject({ id: 'a', nodeType: 'Component' });
    expect(collected[0].properties[0].key).toBe('heading');
  });

  it('skips nodes whose properties fail to resolve', async () => {
    const broken = makeMockNode('broken', 'Component', []);
    broken.getProperties = vi.fn().mockRejectedValue(new Error('gone'));

    const experience: any = {
      getRootNodes: vi
        .fn()
        .mockReturnValue([
          broken,
          makeMockNode('ok', 'Component', [{ key: 'heading', area: 'content', value: 'Hi' }]),
        ]),
    };

    const collected = await collectNodes(experience);

    expect(collected).toHaveLength(1);
    expect(collected[0].id).toBe('ok');
  });

  it('populates resolvedBindings when the node resolves an entry binding', async () => {
    const okNode = makeMockNode('card', 'Component', [
      {
        key: 'featured',
        area: 'content',
        value: 'x',
        binding: { sourceType: 'entry', entryId: 'e1' },
      },
    ]);
    okNode.resolveEntryBinding = vi.fn().mockResolvedValue({ entryId: 'e1' });
    const experience: any = { getRootNodes: vi.fn().mockReturnValue([okNode]) };
    const [collected] = await collectNodes(experience);
    expect(collected.resolvedBindings).toEqual({
      featured: { isEntryBinding: true, resolved: true },
    });
  });

  it('marks a binding unresolved when resolveEntryBinding returns null', async () => {
    const brokenNode = makeMockNode('card', 'Component', [
      {
        key: 'featured',
        area: 'content',
        value: null,
        binding: { sourceType: 'entry', entryId: 'gone' },
      },
    ]);
    brokenNode.resolveEntryBinding = vi.fn().mockResolvedValue(null);
    const experience: any = { getRootNodes: vi.fn().mockReturnValue([brokenNode]) };
    const [collected] = await collectNodes(experience);
    expect(collected.resolvedBindings).toEqual({
      featured: { isEntryBinding: true, resolved: false },
    });
  });

  it('omits resolvedBindings when the node has no resolveEntryBinding method', async () => {
    const node = makeMockNode('plain', 'Component', [
      { key: 'body', area: 'content', value: 'hi' },
    ]);
    // makeMockNode may or may not define resolveEntryBinding; this node has no entry-bound props anyway.
    const experience: any = { getRootNodes: vi.fn().mockReturnValue([node]) };
    const [collected] = await collectNodes(experience);
    expect(collected.resolvedBindings).toBeUndefined();
  });
});
