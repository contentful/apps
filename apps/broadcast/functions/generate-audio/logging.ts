import type { FunctionEventContext } from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import type { AppInstallationParameters, GenerationLogPayload } from './types';
import { LOG_CONTENT_TYPE_ID, LOG_CONTENT_TYPE_NAME } from './constants';

const getErrorStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const maybeError = error as { status?: number; statusCode?: number };
  if (typeof maybeError.statusCode === 'number') {
    return maybeError.statusCode;
  }
  return typeof maybeError.status === 'number' ? maybeError.status : null;
};

const isNotFoundError = (error: unknown): boolean => {
  const status = getErrorStatusCode(error);
  if (status === 404) {
    return true;
  }

  if (error instanceof Error) {
    return error.name === 'NotFound' || error.message.includes('"status": 404');
  }

  return false;
};

const ensureLogContentType = async (
  cma: PlainClientAPI,
  context: FunctionEventContext<AppInstallationParameters>
): Promise<void> => {
  try {
    await cma.contentType.get({
      spaceId: context.spaceId,
      environmentId: context.environmentId,
      contentTypeId: LOG_CONTENT_TYPE_ID,
    });
    return;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const contentType = await cma.contentType.createWithId(
    {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
      contentTypeId: LOG_CONTENT_TYPE_ID,
    },
    {
      name: LOG_CONTENT_TYPE_NAME,
      displayField: 'entryId',
      fields: [
        {
          id: 'entryId',
          name: 'Entry ID',
          type: 'Symbol',
          required: false,
        },
        {
          id: 'locale',
          name: 'Locale',
          type: 'Symbol',
          required: false,
        },
        {
          id: 'charCount',
          name: 'Character Count',
          type: 'Integer',
          required: false,
        },
        {
          id: 'voiceId',
          name: 'Voice ID',
          type: 'Symbol',
          required: false,
        },
        {
          id: 'success',
          name: 'Success',
          type: 'Boolean',
          required: false,
        },
        {
          id: 'contentTypeId',
          name: 'Content Type ID',
          type: 'Symbol',
          required: false,
        },
        {
          id: 'authorEntryId',
          name: 'Author Entry ID',
          type: 'Symbol',
          required: false,
        },
        {
          id: 'latencyMs',
          name: 'Latency (ms)',
          type: 'Integer',
          required: false,
        },
      ],
    }
  );

  await cma.contentType.publish(
    {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
      contentTypeId: contentType.sys.id,
    },
    contentType
  );
};

const buildLogFields = (
  payload: GenerationLogPayload,
  defaultLocale: string
): EntryProps<KeyValueMap>['fields'] => {
  const fields: EntryProps<KeyValueMap>['fields'] = {};
  const addField = <T>(fieldId: string, value: T | null | undefined) => {
    if (value === undefined || value === null) {
      return;
    }
    fields[fieldId] = {
      [defaultLocale]: value,
    };
  };

  addField('entryId', payload.entryId);
  addField('locale', payload.locale);
  addField('charCount', payload.charCount);
  addField('voiceId', payload.voiceId);
  addField('success', payload.success);
  addField('contentTypeId', payload.contentTypeId);
  addField('authorEntryId', payload.authorEntryId);
  addField('latencyMs', payload.latencyMs);

  return fields;
};

export const logGenerationAttempt = async (
  cma: PlainClientAPI,
  context: FunctionEventContext<AppInstallationParameters>,
  payload: GenerationLogPayload,
  defaultLocale: string
): Promise<void> => {
  try {
    await ensureLogContentType(cma, context);
    const fields = buildLogFields(payload, defaultLocale);
    const logEntryId = `broadcast-log-${payload.entryId}-${payload.locale}-${Date.now()}`;

    try {
      const createdEntry = await cma.entry.createWithId(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
          entryId: logEntryId,
          contentTypeId: LOG_CONTENT_TYPE_ID,
        },
        {
          fields,
        }
      );

      await cma.entry.publish(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
          entryId: createdEntry.sys.id,
        },
        createdEntry
      );
    } catch (error) {
      if (getErrorStatusCode(error) !== 409) {
        throw error;
      }

      const existingEntry = await cma.entry.get({
        spaceId: context.spaceId,
        environmentId: context.environmentId,
        entryId: logEntryId,
      });

      const updatedEntry = await cma.entry.update(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
          entryId: logEntryId,
        },
        {
          sys: existingEntry.sys,
          fields,
        }
      );

      await cma.entry.publish(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
          entryId: logEntryId,
        },
        updatedEntry
      );
    }
  } catch (error) {
    console.warn('generate-audio:log-attempt-failed', {
      entryId: payload.entryId,
      locale: payload.locale,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
