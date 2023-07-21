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

  const doesStartGeneration = async (result: useAIOutput) => {
    result.generateMessage(titlePrompt('this is a test'), 'en-US');
    await waitFor(() => expect(result.isGenerating).toBe(true));
    await waitFor(() => expect(result.output).toBeTruthy());
  };

  const doesStopGeneration = async (result: useAIOutput) => {
    result.sendStopSignal();
    await waitFor(() => expect(result.isGenerating).toBe(false));
  };

  const doesResetOutput = async (result: useAIOutput) => {
    result.resetOutput();
    await waitFor(() => expect(result.output).toBe(''));
  };

  it('should start in a default state', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.output).toBe('');
  });

  it('should start generating when triggered', async () => {
    const { result } = renderHook(() => useAI());

    doesStartGeneration(result.current);
  });

  it('should stop generating when triggered', async () => {
    const { result } = renderHook(() => useAI());

    doesStartGeneration(result.current);
    doesStopGeneration(result.current);
  });

  it('should reset output', async () => {
    const { result } = renderHook(() => useAI());

    doesStartGeneration(result.current);
    doesStopGeneration(result.current);
    doesResetOutput(result.current);
  });
});
