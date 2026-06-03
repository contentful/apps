import { describe, expect, it, vi } from 'vitest';
import { collectNodes } from './collect';
import { makeMockNode } from '../../test/mocks';

describe('collectNodes', () => {
  it('resolves properties for every root node', async () => {
    const experience: any = {
      getRootNodes: vi.fn().mockReturnValue([
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
});
