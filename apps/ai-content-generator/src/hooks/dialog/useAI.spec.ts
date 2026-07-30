import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockSdk } from '@test/mocks';
import useAI from './useAI';
import titlePrompt from '@configs/prompts/titlePrompt';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => sdk.cma,
}));

describe('useAI', () => {
  beforeEach(() => {
    mockSdk.reset();
    sdk.cma.appActionCall = {
      createWithResponse: vi.fn().mockResolvedValue({
        response: { body: JSON.stringify({ text: 'Generated text response' }) },
      }),
    };
  });

  it('should start in a default state', () => {
    const { result } = renderHook(() => useAI());
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.output).toBe('');
  });

  it('should call the App Action and set output on success', async () => {
    const { result } = renderHook(() => useAI());
    await result.current.generateMessage(titlePrompt('this is a test'), 'en-US');

    await waitFor(() => expect(result.current.isGenerating).toBe(false));
    await waitFor(() => expect(result.current.output).toBe('Generated text response'));
  });

  it('should set hasError when the App Action call fails', async () => {
    sdk.cma.appActionCall = {
      createWithResponse: vi.fn().mockRejectedValue(new Error('Action failed')),
    };

    const { result } = renderHook(() => useAI());
    await result.current.generateMessage(titlePrompt('this is a test'), 'en-US');

    await waitFor(() => expect(result.current.hasError).toBe(true));
    await waitFor(() => expect(result.current.isGenerating).toBe(false));
  });

  it('resetOutput clears output and error', async () => {
    sdk.cma.appActionCall = {
      createWithResponse: vi.fn().mockRejectedValue(new Error('fail')),
    };

    const { result } = renderHook(() => useAI());
    await result.current.generateMessage(titlePrompt('test'), 'en-US');
    await waitFor(() => expect(result.current.hasError).toBe(true));

    result.current.resetOutput();
    await waitFor(() => expect(result.current.output).toBe(''));
    await waitFor(() => expect(result.current.hasError).toBe(false));
  });
});
