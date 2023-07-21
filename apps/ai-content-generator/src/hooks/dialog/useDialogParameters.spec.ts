import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateRandomInvocationParameters, MockSdk } from '../../../test/mocks';

import useDialogParameters, { DialogParameters } from './useDialogParameters';
import { DialogInvocationParameters } from '@locations/Dialog';

const invocationParameters = generateRandomInvocationParameters();
const mockSdk = new MockSdk({ invocation: invocationParameters });
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('useDialogParameters', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  const expectStateToBe = (result: DialogParameters, expected?: DialogInvocationParameters) => {
    expect(result.isLoading).toBe(expected === undefined);
    expect(result.feature).toBe(expected?.feature);
    expect(result.entryId).toBe(expected?.entryId);
  };

  it('should load immediatly when parameters are present', () => {
    const { result } = renderHook(() => useDialogParameters());
    expectStateToBe(result.current, invocationParameters);
  });

  it('should stay loading until parameters are present', () => {
    sdk.parameters.invocation = undefined;
    const { result, rerender } = renderHook(() => useDialogParameters());
    expectStateToBe(result.current, undefined);

    sdk.parameters.invocation = invocationParameters;

    rerender();
    expectStateToBe(result.current, invocationParameters);
  });

  it('should never load if the parameters are not present', () => {
    sdk.parameters.invocation = undefined;
    const { result, rerender } = renderHook(() => useDialogParameters());

    expectStateToBe(result.current, undefined);

    rerender();
    expectStateToBe(result.current, undefined);
  });
});
