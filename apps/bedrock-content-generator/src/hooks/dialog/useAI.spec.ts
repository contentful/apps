import { MockSdk, generateRandomInvocationParameters } from '@test/mocks';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import titlePrompt from '@configs/prompts/titlePrompt';
import useAI from './useAI';

const invocationParameters = generateRandomInvocationParameters();
const mockSdk = new MockSdk({ invocation: invocationParameters });
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
}));

describe('useAI', () => {
  beforeEach(() => {
    mockSdk.reset();
    (
      sdk.cma as unknown as { appActionCall: { createWithResponse: ReturnType<typeof vi.fn> } }
    ).appActionCall = {
      createWithResponse: vi.fn().mockResolvedValue({
        response: { body: JSON.stringify({ text: 'Generated text' }) },
      }),
    };
  });

  it('should start in a default state', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.output).toBe('');
  });

  it('should start generating when triggered', async () => {
    const { result } = renderHook(() => useAI());
    result.current.generateMessage(titlePrompt('this is a test'), 'en-US');

    await waitFor(() => expect(result.current.isGenerating).toBe(false));
    await waitFor(() => expect(result.current.output).toBeTruthy());
  });

  it('should set hasError when the action fails', async () => {
    (
      sdk.cma as unknown as { appActionCall: { createWithResponse: ReturnType<typeof vi.fn> } }
    ).appActionCall = {
      createWithResponse: vi.fn().mockRejectedValue(new Error('Action failed')),
    };

    const { result } = renderHook(() => useAI());
    await result.current.generateMessage(titlePrompt('this is a test'), 'en-US');

    await waitFor(() => expect(result.current.hasError).toBe(true));
    await waitFor(() => expect(result.current.isGenerating).toBe(false));
  });
});
