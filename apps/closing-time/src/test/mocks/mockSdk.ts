import { vi } from 'vitest';
import type { ConfigAppSDK, DialogAppSDK, FieldAppSDK } from '@contentful/app-sdk';
import type {
  AppInstallationParameters,
  HoursOfOperation,
  DialogInvocationParameters,
} from '../../types';

/**
 * Creates a mock FieldAppSDK for testing Field component
 */
export function createMockFieldSdk(
  options: {
    fieldValue?: HoursOfOperation | null;
    installationParameters?: AppInstallationParameters;
  } = {}
): FieldAppSDK {
  const { fieldValue = null, installationParameters = {} } = options;

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
    installationParameters?: AppInstallationParameters;
  } = {}
): DialogAppSDK {
  const { invocationParameters, installationParameters = {} } = options;

  return {
    ids: {
      app: 'test-app-id',
      space: 'test-space-id',
      environment: 'test-environment-id',
    },
    parameters: {
      installation: installationParameters,
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

/**
 * Creates a mock ConfigAppSDK for testing ConfigScreen component
 */
export function createMockConfigSdk(
  options: {
    parameters?: AppInstallationParameters | null;
    contentTypes?: Array<{
      name: string;
      sys: { id: string };
      fields: Array<{ id: string; name: string; type: string }>;
    }>;
    editorInterfaces?: Record<
      string,
      {
        controls?: Array<{
          fieldId: string;
          widgetId?: string;
          widgetNamespace?: string;
        }>;
        sys?: { version?: number };
      }
    >;
  } = {}
): ConfigAppSDK<AppInstallationParameters> {
  const { parameters = null, contentTypes = [], editorInterfaces = {} } = options;
  const contentTypesById = contentTypes.reduce<
    Record<
      string,
      {
        name: string;
        sys: { id: string; version?: number; publishedVersion?: number };
        fields: Array<{ id: string; name: string; type: string }>;
      }
    >
  >((map, contentType) => {
    map[contentType.sys.id] = {
      ...contentType,
      sys: { ...contentType.sys, version: 1, publishedVersion: 1 },
    };
    return map;
  }, {});

  let configureHandler: (() => unknown | Promise<unknown>) | undefined;
  let completionHandler: ((err: null | { message: string }) => void | Promise<void>) | undefined;

  return {
    ids: {
      app: 'test-app-id',
      space: 'test-space-id',
      environment: 'test-environment-id',
    },
    app: {
      getParameters: vi.fn(() => Promise.resolve(parameters)),
      getCurrentState: vi.fn(() => Promise.resolve({ EditorInterface: {} })),
      onConfigure: vi.fn((handler) => {
        configureHandler = handler;
      }),
      onConfigurationCompleted: vi.fn((handler) => {
        completionHandler = handler;
      }),
      setReady: vi.fn(() => Promise.resolve()),
      isInstalled: vi.fn(() => Promise.resolve(Boolean(parameters))),
    },
    cma: {
      contentType: {
        getMany: vi.fn(() => Promise.resolve({ items: contentTypes })),
        get: vi.fn(({ contentTypeId }: { contentTypeId: string }) =>
          Promise.resolve(contentTypesById[contentTypeId])
        ),
        update: vi.fn(
          (
            { contentTypeId }: { contentTypeId: string },
            value: {
              name: string;
              fields: Array<{ id: string; name: string; type: string }>;
              sys?: { version?: number; publishedVersion?: number };
            }
          ) => {
            const current = contentTypesById[contentTypeId];
            const nextVersion = (current?.sys.version ?? 1) + 1;
            const updated = {
              ...value,
              sys: {
                id: contentTypeId,
                version: nextVersion,
                publishedVersion: current?.sys.publishedVersion,
              },
            };
            contentTypesById[contentTypeId] = updated;
            return Promise.resolve(updated);
          }
        ),
        publish: vi.fn(
          ({ contentTypeId }: { contentTypeId: string }, value: { sys?: { version?: number } }) => {
            const current = contentTypesById[contentTypeId];
            const published = {
              ...current,
              sys: {
                ...current.sys,
                publishedVersion: value.sys?.version ?? current.sys.version,
              },
            };
            contentTypesById[contentTypeId] = published;
            return Promise.resolve(published);
          }
        ),
      },
      editorInterface: {
        get: vi.fn(({ contentTypeId }: { contentTypeId: string }) =>
          Promise.resolve(
            editorInterfaces[contentTypeId] ?? {
              controls: [],
              sys: { version: 1 },
            }
          )
        ),
        update: vi.fn(
          (
            { contentTypeId }: { contentTypeId: string },
            value: {
              controls?: Array<{
                fieldId: string;
                widgetId?: string;
                widgetNamespace?: string;
              }>;
              sys?: { version?: number };
            }
          ) => {
            const current = editorInterfaces[contentTypeId] ?? {
              controls: [],
              sys: { version: 1 },
            };
            const next = {
              ...value,
              sys: {
                version: (current.sys?.version ?? 1) + 1,
              },
            };
            editorInterfaces[contentTypeId] = next;
            return Promise.resolve(next);
          }
        ),
      },
    },
    notifier: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    },
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
    },
    __invokeConfigure: async () => configureHandler?.(),
    __invokeConfigurationCompleted: async (error: null | { message: string }) =>
      completionHandler?.(error),
  } as unknown as ConfigAppSDK<AppInstallationParameters>;
}
