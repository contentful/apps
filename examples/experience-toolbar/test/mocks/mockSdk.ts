import { vi } from 'vitest';

/**
 * A minimal mock of the `ExperienceEditorToolbarAppSDK` surface used by the
 * example. Subscription methods record their callback so tests can drive
 * changes (selection, ui mode, context) and assert the UI reacts. Each
 * subscription returns an unsubscribe spy.
 */
const noopUnsubscribe = vi.fn();

const mockNode = {
  id: 'node-1',
  nodeType: 'Component' as const,
  get: vi.fn().mockReturnValue({ id: 'node-1', nodeType: 'Component' }),
  onChange: vi.fn().mockReturnValue(noopUnsubscribe),
  getProperties: vi.fn().mockResolvedValue([
    { key: 'heading', area: 'content', value: 'Welcome' },
    { key: 'backgroundColor', area: 'design', value: { type: 'ManualDesignValue', value: '#fff' } },
  ]),
};

const mockSdk: any = {
  location: {
    is: vi.fn().mockReturnValue(true),
  },
  ids: {
    app: 'test-app',
  },
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue(null),
  },
  experiences: {
    context: { type: 'experience', entityId: 'experience-123' },
    onContextChanged: vi.fn().mockReturnValue(noopUnsubscribe),
    getUiMode: vi.fn().mockReturnValue('visual'),
    onUiModeChanged: vi.fn().mockReturnValue(noopUnsubscribe),
    experience: {
      getNode: vi.fn().mockReturnValue(mockNode),
      getRootNodes: vi.fn().mockReturnValue([mockNode]),
      selection: {
        get: vi.fn().mockReturnValue({ nodeId: null }),
        onChange: vi.fn().mockReturnValue(noopUnsubscribe),
        set: vi.fn(),
        highlight: vi.fn(),
      },
    },
  },
};

export { mockSdk, mockNode, noopUnsubscribe };
