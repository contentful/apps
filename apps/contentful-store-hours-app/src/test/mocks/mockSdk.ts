import { vi } from 'vitest';
import type { FieldAppSDK, DialogAppSDK } from '@contentful/app-sdk';
import type { HoursOfOperation, DialogInvocationParameters } from '../../types';

/**
 * Creates a mock FieldAppSDK for testing Field component
 */
export function createMockFieldSdk(
  options: {
    fieldValue?: HoursOfOperation | null;
  } = {}
): FieldAppSDK {
  const { fieldValue = null } = options;

  let currentValue = fieldValue;

  return {
    ids: {
      app: 'test-app-id',
      space: 'test-space-id',
      environment: 'test-environment-id',
      entry: 'test-entry-id',
      field: 'test-field-id',
    },
    field: {
      getValue: vi.fn(() => currentValue),
      setValue: vi.fn((value: HoursOfOperation | null) => {
        currentValue = value;
        return Promise.resolve();
      }),
      removeValue: vi.fn(() => {
        currentValue = null;
        return Promise.resolve();
      }),
      onValueChanged: vi.fn((callback: (value: HoursOfOperation | null) => void) => {
        callback(currentValue);
        return () => {};
      }),
      id: 'hours',
      type: 'Object',
      locale: 'en-US',
    },
    dialogs: {
      openCurrentApp: vi.fn((options?: { parameters?: DialogInvocationParameters }) =>
        Promise.resolve(options?.parameters?.hours ?? null)
      ),
    },
    parameters: {
      installation: {},
      instance: {},
    },
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
    },
  } as unknown as FieldAppSDK;
}

/**
 * Creates a mock DialogAppSDK for testing Dialog component
 */
export function createMockDialogSdk(
  options: {
    invocationParameters?: DialogInvocationParameters;
  } = {}
): DialogAppSDK {
  const { invocationParameters } = options;

  return {
    ids: {
      app: 'test-app-id',
      space: 'test-space-id',
      environment: 'test-environment-id',
    },
    parameters: {
      invocation: invocationParameters,
    },
    close: vi.fn((_result?: HoursOfOperation | null) => Promise.resolve()),
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
    },
  } as unknown as DialogAppSDK;
}
