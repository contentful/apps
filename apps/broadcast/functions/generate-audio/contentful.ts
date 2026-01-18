import type { FunctionEventContext } from '@contentful/node-apps-toolkit';
import type {
  AssetProps,
  ContentTypeProps,
  EntryProps,
  KeyValueMap,
  LocaleProps,
  PlainClientAPI,
} from 'contentful-management';
import { createClient } from 'contentful-management';
import type { AppInstallationParameters, AssetLink, EntryLink } from './types';

export const initContentfulManagementClient = (
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

export const getDefaultLocale = (locales: LocaleProps[]): string => {
  const defaultLocale = locales.find((locale) => locale.default);
  return defaultLocale?.code ?? locales[0]?.code ?? 'en-US';
};

export const buildFallbackChain = (
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

export const resolveLocalizedText = (
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

export const resolveFieldLocalization = (
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

export const isAssetLink = (value: unknown): value is AssetLink => {
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

export const isEntryLink = (value: unknown): value is EntryLink => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeLink = value as EntryLink;
  return (
    maybeLink.sys?.type === 'Link' &&
    maybeLink.sys?.linkType === 'Entry' &&
    typeof maybeLink.sys?.id === 'string'
  );
};

export const getEntryLinkFromValue = (value: unknown): EntryLink | null => {
  if (isEntryLink(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (isEntryLink(item)) {
        return item;
      }
    }
  }

  return null;
};

export const resolveLocalizedEntryLink = (
  entry: EntryProps<KeyValueMap>,
  fieldId: string,
  locales: LocaleProps[],
  targetLocale: string,
  defaultLocale: string,
  isLocalized: boolean
): EntryLink | null => {
  const fieldValue = entry.fields[fieldId] as Record<string, unknown> | undefined;
  if (!fieldValue) {
    return null;
  }

  const localeChain = isLocalized
    ? buildFallbackChain(locales, targetLocale, defaultLocale)
    : [defaultLocale];

  for (const locale of localeChain) {
    const value = fieldValue[locale];
    const link = getEntryLinkFromValue(value);
    if (link) {
      return link;
    }
  }

  return null;
};

export const findAuthorReferenceField = (
  contentType: ContentTypeProps,
  authorFieldId: string
): { fieldId: string; fieldName: string; isLocalized: boolean } | null => {
  for (const field of contentType.fields) {
    const normalizedId = field.id.toLowerCase();
    const normalizedName = field.name?.toLowerCase() ?? '';
    const looksLikeAuthor =
      normalizedId === authorFieldId ||
      normalizedId.includes(authorFieldId) ||
      normalizedName.includes(authorFieldId);
    const isEntryLinkField =
      (field.type === 'Link' && field.linkType === 'Entry') ||
      (field.type === 'Array' && field.items?.type === 'Link' && field.items?.linkType === 'Entry');

    if (looksLikeAuthor && isEntryLinkField) {
      return {
        fieldId: field.id,
        fieldName: field.name ?? field.id,
        isLocalized: Boolean(field.localized),
      };
    }
  }

  return null;
};

export const isArchivedEntry = (entry: EntryProps<KeyValueMap>): boolean => {
  const sys = entry.sys as EntryProps<KeyValueMap>['sys'] & {
    archivedVersion?: number;
    archivedAt?: string;
  };
  return Boolean(sys.archivedVersion || sys.archivedAt);
};

export const buildAssetFields = (
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
