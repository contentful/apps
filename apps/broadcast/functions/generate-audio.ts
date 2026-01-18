import type {
  AppActionResponse,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { AssetProps, EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { getMockAudioBuffer } from '../lib/mock-audio';
import { AUTHOR_FIELD_ID, AUTHOR_VOICE_FIELD_ID, BODY_FIELD_ID } from './generate-audio/constants';
import {
  buildAssetFields,
  findAuthorReferenceField,
  getDefaultLocale,
  initContentfulManagementClient,
  isArchivedEntry,
  isAssetLink,
  resolveFieldLocalization,
  resolveLocalizedEntryLink,
  resolveLocalizedText,
} from './generate-audio/contentful';
import { fetchElevenLabsAudio } from './generate-audio/elevenlabs';
import { logGenerationAttempt } from './generate-audio/logging';
import type {
  AppInstallationParameters,
  GenerateAudioActionRequest,
  GenerateAudioResult,
} from './generate-audio/types';

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

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppInstallationParameters
> = async (
  event: GenerateAudioActionRequest,
  context: FunctionEventContext<AppInstallationParameters>
): Promise<AppActionResponse> => {
  const startedAt = Date.now();
  let cma: PlainClientAPI | null = null;
  let defaultLocale = 'en-US';
  let resolvedVoiceIdForLog: string | undefined;
  let logCharCount: number | undefined;
  let logContentTypeId: string | undefined;
  let logAuthorEntryId: string | undefined;
  let logLocale: string | undefined;
  let logEntryId: string | undefined;

  try {
    const { entryId, fieldId, targetLocale, voiceId: requestVoiceId } = event.body;
    logEntryId = entryId;
    logLocale = targetLocale;
    resolvedVoiceIdForLog = requestVoiceId;

    if (!entryId || !fieldId || !targetLocale) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing required parameters for audio generation.',
            type: 'ValidationError',
          },
        ],
      };
    }

    const appInstallationParameters = context.appInstallationParameters ?? {};

    const useMockAi =
      appInstallationParameters.useMockAi === true ||
      String(appInstallationParameters.useMockAi ?? '').toLowerCase() === 'true';
    const elevenLabsApiKey = appInstallationParameters.elevenLabsApiKey;
    const fallbackVoiceId = appInstallationParameters.voiceId ?? requestVoiceId;

    if (!useMockAi && !elevenLabsApiKey) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing ElevenLabs API key in app installation parameters.',
            type: 'ConfigurationError',
          },
        ],
      };
    }

    if (!fallbackVoiceId) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing voiceId for audio generation.',
            type: 'ConfigurationError',
          },
        ],
      };
    }

    cma = initContentfulManagementClient(context);
    const [localeResponse, entry] = await Promise.all([
      cma.locale.getMany({
        spaceId: context.spaceId,
        environmentId: context.environmentId,
      }),
      cma.entry.get({
        spaceId: context.spaceId,
        environmentId: context.environmentId,
        entryId,
      }),
    ]);

    const locales = localeResponse.items;
    const localeCodes = new Set(locales.map((locale) => locale.code));
    if (!localeCodes.has(targetLocale)) {
      return {
        ok: false,
        errors: [
          {
            message: `Target locale ${targetLocale} is not available in this environment.`,
            type: 'ValidationError',
          },
        ],
      };
    }

    defaultLocale = getDefaultLocale(locales);
    resolvedVoiceIdForLog = fallbackVoiceId;
    logContentTypeId = entry.sys.contentType.sys.id;

    const contentType = await cma.contentType.get({
      spaceId: context.spaceId,
      environmentId: context.environmentId,
      contentTypeId: entry.sys.contentType.sys.id,
    });

    const bodyFieldInfo = resolveFieldLocalization(contentType, BODY_FIELD_ID);
    if (!bodyFieldInfo) {
      return {
        ok: false,
        errors: [
          {
            message: `Missing text field: ${BODY_FIELD_ID}.`,
            type: 'ValidationError',
          },
        ],
      };
    }

    const authorFieldInfo = findAuthorReferenceField(contentType, AUTHOR_FIELD_ID);
    let resolvedVoiceId: string | null = null;

    if (authorFieldInfo) {
      const authorLink = resolveLocalizedEntryLink(
        entry,
        authorFieldInfo.fieldId,
        locales,
        targetLocale,
        defaultLocale,
        authorFieldInfo.isLocalized
      );

      if (authorLink) {
        logAuthorEntryId = authorLink.sys.id;
        try {
          const authorEntry = await cma.entry.get({
            spaceId: context.spaceId,
            environmentId: context.environmentId,
            entryId: authorLink.sys.id,
          });

          if (!isArchivedEntry(authorEntry)) {
            const authorContentType = await cma.contentType.get({
              spaceId: context.spaceId,
              environmentId: context.environmentId,
              contentTypeId: authorEntry.sys.contentType.sys.id,
            });

            const authorVoiceField = resolveFieldLocalization(
              authorContentType,
              AUTHOR_VOICE_FIELD_ID
            );

            if (authorVoiceField) {
              const authorVoiceId = resolveLocalizedText(
                authorEntry,
                AUTHOR_VOICE_FIELD_ID,
                locales,
                targetLocale,
                defaultLocale,
                authorVoiceField.isLocalized
              );

              if (authorVoiceId?.trim()) {
                resolvedVoiceId = authorVoiceId.trim();
              }
            }
          }
        } catch (error) {
          console.warn('generate-audio:author-lookup-failed', {
            authorEntryId: authorLink.sys.id,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    const effectiveVoiceId = resolvedVoiceId ?? fallbackVoiceId;

    const assetFieldInfo = resolveFieldLocalization(contentType, fieldId);
    if (!assetFieldInfo) {
      return {
        ok: false,
        errors: [
          {
            message: `Missing asset field: ${fieldId}.`,
            type: 'ValidationError',
          },
        ],
      };
    }

    const text = resolveLocalizedText(
      entry,
      BODY_FIELD_ID,
      locales,
      targetLocale,
      defaultLocale,
      bodyFieldInfo.isLocalized
    );

    if (!text) {
      return {
        ok: false,
        errors: [
          {
            message: `No text found for ${bodyFieldInfo.fieldName} in ${targetLocale} or its fallbacks.`,
            type: 'ValidationError',
          },
        ],
      };
    }

    logCharCount = text.length;
    const audioBuffer = useMockAi
      ? await getMockAudioBuffer()
      : await fetchElevenLabsAudio(effectiveVoiceId, text, elevenLabsApiKey as string);

    const upload = await cma.upload.create(
      {
        spaceId: context.spaceId,
        environmentId: context.environmentId,
      },
      { file: audioBuffer }
    );

    const assetLocale = assetFieldInfo.isLocalized ? targetLocale : defaultLocale;
    const currentFieldValue = entry.fields[fieldId] as Record<string, unknown> | undefined;
    const currentAssetLink = currentFieldValue ? currentFieldValue[assetLocale] : undefined;
    const existingAssetId = isAssetLink(currentAssetLink) ? currentAssetLink.sys.id : null;

    const assetTitle = `Broadcast Audio - ${entryId} - ${targetLocale}`;
    const fileName = `broadcast-${entryId}-${targetLocale}.mp3`;
    const includeDefaultLocale =
      assetFieldInfo.isLocalized && !existingAssetId && targetLocale !== defaultLocale;

    let updatedAsset: AssetProps;

    if (!existingAssetId) {
      const newAssetFields = buildAssetFields(
        null,
        assetTitle,
        fileName,
        upload.sys.id,
        assetLocale,
        defaultLocale,
        includeDefaultLocale
      );

      const createdAsset = await cma.asset.create(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
        },
        {
          fields: newAssetFields,
        }
      );

      updatedAsset = createdAsset;
    } else {
      const existingAsset = await cma.asset.get({
        spaceId: context.spaceId,
        environmentId: context.environmentId,
        assetId: existingAssetId,
      });

      const mergedFields = buildAssetFields(
        existingAsset,
        assetTitle,
        fileName,
        upload.sys.id,
        assetLocale,
        defaultLocale,
        false
      );

      updatedAsset = await cma.asset.update(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
          assetId: existingAssetId,
        },
        {
          sys: existingAsset.sys,
          fields: mergedFields,
        }
      );
    }

    const processedAsset = await cma.asset.processForAllLocales(
      {
        spaceId: context.spaceId,
        environmentId: context.environmentId,
      },
      updatedAsset
    );

    const publishedAsset = await cma.asset.publish(
      {
        spaceId: context.spaceId,
        environmentId: context.environmentId,
        assetId: processedAsset.sys.id,
      },
      processedAsset
    );

    const assetUrl =
      publishedAsset.fields.file?.[assetLocale]?.url ??
      publishedAsset.fields.file?.[defaultLocale]?.url;
    if (!assetUrl) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing asset URL after publishing.',
            type: 'AssetError',
          },
        ],
      };
    }

    const updatedEntryFields = {
      ...entry.fields,
      [fieldId]: {
        ...(entry.fields[fieldId] as Record<string, unknown> | undefined),
        [assetLocale]: {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: publishedAsset.sys.id,
          },
        },
      },
    };

    const updateEntryWithFields = async (
      fields: EntryProps<KeyValueMap>['fields'],
      sys: EntryProps<KeyValueMap>['sys']
    ) =>
      cma.entry.update(
        {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
          entryId: entry.sys.id,
        },
        {
          sys,
          fields,
        }
      );

    const buildLatestFields = (latestEntry: EntryProps<KeyValueMap>) => ({
      ...latestEntry.fields,
      [fieldId]: {
        ...(latestEntry.fields[fieldId] as Record<string, unknown> | undefined),
        [assetLocale]: {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: publishedAsset.sys.id,
          },
        },
      },
    });

    const updateEntryWithRetry = async (
      initialFields: EntryProps<KeyValueMap>['fields'],
      initialSys: EntryProps<KeyValueMap>['sys']
    ) => {
      const maxRetries = 2;
      let attempt = 0;
      let currentFields = initialFields;
      let currentSys = initialSys;

      while (true) {
        try {
          await updateEntryWithFields(currentFields, currentSys);
          return;
        } catch (error) {
          if (getErrorStatusCode(error) !== 409 || attempt >= maxRetries) {
            throw error;
          }

          attempt += 1;
          const latestEntry = await cma.entry.get({
            spaceId: context.spaceId,
            environmentId: context.environmentId,
            entryId: entry.sys.id,
          });
          currentFields = buildLatestFields(latestEntry);
          currentSys = latestEntry.sys;
        }
      }
    };

    await updateEntryWithRetry(updatedEntryFields, entry.sys);

    if (cma && logEntryId && logLocale) {
      await logGenerationAttempt(
        cma,
        context,
        {
          entryId: logEntryId,
          locale: logLocale,
          charCount: logCharCount,
          voiceId: effectiveVoiceId,
          success: true,
          contentTypeId: logContentTypeId,
          authorEntryId: logAuthorEntryId,
          latencyMs: Date.now() - startedAt,
        },
        defaultLocale
      );
    }

    return {
      ok: true,
      data: {
        status: 'success',
        assetId: publishedAsset.sys.id,
        url: assetUrl.startsWith('//') ? `https:${assetUrl}` : assetUrl,
        locale: targetLocale,
      } satisfies GenerateAudioResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? { message, stack: error.stack } : { message };
    console.error('generate-audio:error', errorDetails);

    if (cma && logEntryId && logLocale) {
      await logGenerationAttempt(
        cma,
        context,
        {
          entryId: logEntryId,
          locale: logLocale,
          charCount: logCharCount,
          voiceId: resolvedVoiceIdForLog,
          success: false,
          contentTypeId: logContentTypeId,
          authorEntryId: logAuthorEntryId,
          latencyMs: Date.now() - startedAt,
        },
        defaultLocale
      );
    }

    return {
      ok: false,
      errors: [
        {
          message,
          type: 'UnhandledError',
        },
      ],
    };
  }
};
