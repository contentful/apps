import type {
  AppActionRequest,
  AppActionResponse,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import {
  AssetProps,
  ContentTypeProps,
  createClient,
  EntryProps,
  KeyValueMap,
  LocaleProps,
  PlainClientAPI,
} from 'contentful-management';
import { getMockAudioBuffer } from '../lib/mock-audio';

type GenerateAudioRequest = {
  entryId: string;
  fieldId: string;
  targetLocale: string;
  voiceId?: string;
};

type GenerateAudioResult = {
  status: 'success';
  assetId: string;
  url: string;
  locale: string;
};

type AppInstallationParameters = {
  elevenLabsApiKey?: string;
  useMockAi?: boolean | string;
  voiceId?: string;
};

type AssetLink = {
  sys: {
    type: 'Link';
    linkType: 'Asset';
    id: string;
  };
};

const BODY_FIELD_ID = 'body';

const fetchElevenLabsAudio = async (
  voiceId: string,
  text: string,
  apiKey: string
): Promise<ArrayBuffer> => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.arrayBuffer();
};

const initContentfulManagementClient = (
  context: FunctionEventContext<AppInstallationParameters>
): PlainClientAPI => {
  if (context.cma) {
    return context.cma;
  }

  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }

  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
};

const getDefaultLocale = (locales: LocaleProps[]): string => {
  const defaultLocale = locales.find((locale) => locale.default);
  return defaultLocale?.code ?? locales[0]?.code ?? 'en-US';
};

const buildFallbackChain = (
  locales: LocaleProps[],
  targetLocale: string,
  defaultLocale: string
): string[] => {
  const localeMap = new Map(locales.map((locale) => [locale.code, locale]));
  const chain: string[] = [];
  const visited = new Set<string>();

  let current: string | undefined = targetLocale;
  while (current && !visited.has(current)) {
    chain.push(current);
    visited.add(current);
    current = localeMap.get(current)?.fallbackCode ?? undefined;
  }

  if (!chain.includes(defaultLocale)) {
    chain.push(defaultLocale);
  }

  return chain;
};

const resolveLocalizedText = (
  entry: EntryProps<KeyValueMap>,
  fieldId: string,
  locales: LocaleProps[],
  targetLocale: string,
  defaultLocale: string,
  isLocalized: boolean
): string | null => {
  const fieldValue = entry.fields[fieldId] as Record<string, unknown> | undefined;
  if (!fieldValue) {
    return null;
  }

  const localeChain = isLocalized
    ? buildFallbackChain(locales, targetLocale, defaultLocale)
    : [defaultLocale];

  for (const locale of localeChain) {
    const value = fieldValue[locale];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const resolveFieldLocalization = (
  contentType: ContentTypeProps,
  fieldId: string
): { isLocalized: boolean; fieldName: string } | null => {
  const field = contentType.fields.find((contentField) => contentField.id === fieldId);
  if (!field) {
    return null;
  }

  return {
    isLocalized: Boolean(field.localized),
    fieldName: field.name ?? fieldId,
  };
};

const isAssetLink = (value: unknown): value is AssetLink => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeLink = value as AssetLink;
  return (
    maybeLink.sys?.type === 'Link' &&
    maybeLink.sys?.linkType === 'Asset' &&
    typeof maybeLink.sys?.id === 'string'
  );
};

const buildAssetFields = (
  asset: AssetProps | null,
  title: string,
  fileName: string,
  uploadId: string,
  targetLocale: string,
  defaultLocale: string,
  includeDefaultLocale: boolean
): AssetProps['fields'] => {
  const filePayload = {
    contentType: 'audio/mpeg',
    fileName,
    uploadFrom: {
      sys: {
        type: 'Link',
        linkType: 'Upload',
        id: uploadId,
      },
    },
  };

  const existingTitle = asset?.fields?.title ?? {};
  const existingFile = asset?.fields?.file ?? {};

  return {
    ...asset?.fields,
    title: {
      ...existingTitle,
      [targetLocale]: title,
      ...(includeDefaultLocale ? { [defaultLocale]: title } : {}),
    },
    file: {
      ...existingFile,
      [targetLocale]: filePayload,
      ...(includeDefaultLocale ? { [defaultLocale]: filePayload } : {}),
    },
  };
};

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppInstallationParameters
> = async (
  event: AppActionRequest<'Custom', GenerateAudioRequest>,
  context: FunctionEventContext<AppInstallationParameters>
): Promise<AppActionResponse> => {
  try {
    const { entryId, fieldId, targetLocale, voiceId: requestVoiceId } = event.body;

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
    const effectiveVoiceId = requestVoiceId ?? appInstallationParameters.voiceId;

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

    if (!effectiveVoiceId) {
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

    const cma = initContentfulManagementClient(context);
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

    const defaultLocale = getDefaultLocale(locales);

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

    await cma.entry.update(
      {
        spaceId: context.spaceId,
        environmentId: context.environmentId,
        entryId: entry.sys.id,
      },
      {
        sys: entry.sys,
        fields: updatedEntryFields,
      }
    );

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
