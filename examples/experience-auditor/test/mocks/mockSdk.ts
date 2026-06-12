import { vi } from 'vitest';
import type { ComponentPropertyDescriptor } from '@contentful/app-sdk';

const noopUnsubscribe = vi.fn();

/** Builds a mock ExoNodeAPI whose getProperties resolves the given descriptors. */
export function makeMockNode(
  id: string,
  nodeType: 'Component' | 'Fragment' | 'InlineFragment' | 'Slot',
  properties: ComponentPropertyDescriptor[]
) {
  return {
    id,
    nodeType,
    get: vi.fn().mockReturnValue({ id, nodeType }),
    onChange: vi.fn().mockReturnValue(noopUnsubscribe),
    getProperties: vi.fn().mockResolvedValue(properties),
    resolveEntryBinding: vi.fn().mockResolvedValue({ entryId: 'mock-entry' }),
    getContentProperty: vi.fn().mockResolvedValue(undefined),
    setContentProperty: vi.fn().mockResolvedValue(undefined),
    onContentPropertyChanged: vi.fn().mockReturnValue(noopUnsubscribe),
  };
}

const defaultNodes = [
  makeMockNode('hero', 'Component', [
    { key: 'image', area: 'content', value: { sys: { id: 'asset-1' } } },
    { key: 'altText', area: 'content', value: '' }, // -> a11y error
    { key: 'heading', area: 'content', value: 'Welcome' },
  ]),
  makeMockNode('cta', 'Component', [
    { key: 'heading', area: 'content', value: '' }, // -> warning
  ]),
];

const mockSdk: any = {
  location: { is: vi.fn().mockReturnValue(true) },
  ids: { app: 'test-app' },
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue(null),
  },
  access: {
    can: vi.fn().mockResolvedValue(true),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  exo: {
    context: { type: 'experience', entityId: 'experience-123' },
    onContextChanged: vi.fn().mockReturnValue(noopUnsubscribe),
    getUiMode: vi.fn().mockReturnValue('visual'),
    onUiModeChanged: vi.fn().mockReturnValue(noopUnsubscribe),
    experience: {
      get: vi.fn(),
      onChange: vi.fn().mockReturnValue(noopUnsubscribe),
      save: vi.fn().mockResolvedValue(undefined),
      publish: vi.fn().mockResolvedValue(undefined),
      getNode: vi.fn((id: string) => defaultNodes.find((n) => n.id === id) ?? null),
      getRootNodes: vi.fn().mockReturnValue(defaultNodes),
      selection: {
        get: vi.fn().mockReturnValue({ nodeId: null }),
        onChange: vi.fn().mockReturnValue(noopUnsubscribe),
        set: vi.fn(),
        highlight: vi.fn(),
      },
    },
  },
};

export { mockSdk, defaultNodes, noopUnsubscribe };
// `makeMockNode` is exported above at its declaration.
