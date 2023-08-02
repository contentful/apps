import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIMock, generateRandomInvocationParameters, MockSdk } from '@test/mocks';

import useAI, { useAIOutput } from './useAI';
import titlePrompt from '@configs/prompts/titlePrompt';

const invocationParameters = generateRandomInvocationParameters();
const mockSdk = new MockSdk({ invocation: invocationParameters });
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

vi.mock('@utils/aiApi', () => AIMock);

describe('useAI', () => {
  beforeEach(() => {
    mockSdk.reset();
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

  it('should stop generating when triggered and reset output', async () => {
    const { result } = renderHook(() => useAI());
    result.current.generateMessage(titlePrompt('this is a test'), 'en-US');
    await waitFor(() => expect(result.current.isGenerating).toBe(true));

    result.current.sendStopSignal();
    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    result.current.resetOutput();
    await waitFor(() => expect(result.current.output).toEqual(''));
  });
});
