import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
    entry: 'test-entry',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    appAction: {
      getMany: vi.fn().mockResolvedValue({
        items: [
          {
            name: 'Get Usage Metrics',
            sys: { id: 'usage-action' },
          },
          {
            name: 'Generate Audio',
            sys: { id: 'audio-action' },
          },
        ],
      }),
    },
    appActionCall: {
      createWithResult: vi.fn().mockResolvedValue({
        sys: {
          status: 'succeeded',
          result: {
            ok: true,
            data: {
              status: 'active',
              character_count: 1200,
              character_limit: 10000,
              tier: 'starter',
              next_character_count_reset_unix: 1700000000,
            },
          },
        },
      }),
    },
  },
  locales: {
    available: ['en-US'],
    default: 'en-US',
  },
  entry: {
    fields: {
      body: {
        getValue: vi.fn().mockReturnValue('Test body'),
      },
      audioAsset: {
        getValue: vi.fn().mockReturnValue(undefined),
      },
    },
  },
  notifier: {
    error: vi.fn(),
  },
  navigator: {
    openEntry: vi.fn(),
  },
  parameters: {
    installation: {
      voiceId: 'test-voice-id',
    },
  },
};

export { mockSdk };
