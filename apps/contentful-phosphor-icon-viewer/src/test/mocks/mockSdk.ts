import { vi } from 'vitest';
import type { FieldAppSDK, DialogAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import type { AppInstallationParameters, DialogInvocationParameters } from '../../types/parameters';
import type { IconFieldValue } from '../../types/icon';

/**
 * Creates a mock FieldAppSDK for testing Field component
 */
export function createMockFieldSdk(
  options: {
    fieldValue?: IconFieldValue | null;
    installationParameters?: AppInstallationParameters;
  } = {}
): FieldAppSDK {
  const {
    fieldValue = null,
    installationParameters = { enabledWeights: ['regular', 'bold', 'fill'] },
  } = options;

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
      setValue: vi.fn((value: IconFieldValue | null) => {
        currentValue = value;
        return Promise.resolve();
      }),
      removeValue: vi.fn(() => {
        currentValue = null;
        return Promise.resolve();
      }),
      onValueChanged: vi.fn((callback: (value: IconFieldValue | null) => void) => {
        callback(currentValue);
        return () => {};
      }),
      id: 'icon',
      type: 'Object',
      locale: 'en-US',
    },
    dialogs: {
      openCurrentApp: vi.fn((options?: { parameters?: DialogInvocationParameters }) =>
        Promise.resolve(options?.parameters?.currentValue ?? null)
      ),
    },
    parameters: {
      installation: installationParameters,
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
  const { invocationParameters = { enabledWeights: ['regular', 'bold', 'fill'] } } = options;

  return {
    ids: {
      app: 'test-app-id',
      space: 'test-space-id',
      environment: 'test-environment-id',
    },
    parameters: {
      invocation: invocationParameters,
    },
    close: vi.fn((result?: IconFieldValue | null) => Promise.resolve()),
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
    },
  } as unknown as DialogAppSDK;
}

/**
 * Creates a mock ConfigAppSDK for testing ConfigScreen component
 */
export function createMockConfigSdk(
  options: {
    installationParameters?: AppInstallationParameters | null;
  } = {}
): ConfigAppSDK {
  const { installationParameters = null } = options;

  let onConfigureCallback: (() => Promise<unknown>) | null = null;

  return {
    ids: {
      app: 'test-app-id',
      space: 'test-space-id',
      environment: 'test-environment-id',
      organization: 'test-org-id',
    },
    app: {
      getParameters: vi.fn(() => Promise.resolve(installationParameters)),
      setReady: vi.fn(),
      onConfigure: vi.fn((callback: () => Promise<unknown>) => {
        onConfigureCallback = callback;
      }),
      getCurrentState: vi.fn(() => Promise.resolve({})),
      // Helper to trigger configure for tests
      _triggerConfigure: () => onConfigureCallback?.(),
    },
    notifier: {
      error: vi.fn(),
      success: vi.fn(),
    },
  } as unknown as ConfigAppSDK & { app: { _triggerConfigure: () => Promise<unknown> | undefined } };
}
