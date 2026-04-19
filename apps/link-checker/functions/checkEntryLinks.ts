import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { createClient, PlainClientAPI } from 'contentful-management';
import { extractUrlsFromEntry, isRelativeUrl, type ExtractedUrl } from '../utils/extractUrls';
import { normalizeDomainPattern, urlMatchesAnyDomainPattern } from '../utils/domainPatterns';
import { checkUrl, type CheckLinkResult } from './checkLink';

interface CheckEntryLinksParameters {
  entryId?: string;
  fieldId?: string;
  locale?: string;
}

interface CheckEntryLinksEvent {
  body?: CheckEntryLinksParameters;
}

interface ContentTypeField {
  id: string;
  name?: string;
  type: string;
}

interface RichEntryField {
  [locale: string]: unknown;
}

interface EntryLikeField {
  id: string;
  name: string;
  type: string;
  locales: string[];
  getValue: (locale?: string) => unknown;
}

interface EntryLike {
  fields: Record<string, EntryLikeField>;
}

interface EntryLinkResult extends CheckLinkResult {
  url: string;
  resolvedUrl?: string;
  fieldId: string;
  fieldName: string;
  locale: string;
  isValid: boolean;
  isBlockedByAllowList: boolean;
  isOnDenyList: boolean;
}

interface AppInstallationParameters {
  allowedUrlPatterns?: string;
  forbiddenUrlPatterns?: string;
  baseUrl?: string;
}

interface CheckEntryLinksResponse {
  entryId: string;
  fieldId: string;
  locale?: string;
  checkedCount: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  summary: string;
  results: EntryLinkResult[];
}

export interface CheckAllEntryLinksParameters {
  entryId?: string;
  locale?: string;
  fieldIds?: string[];
}

export interface CheckAllEntryLinksResponse {
  entryId: string;
  locale?: string;
  checkedFieldIds: string[];
  checkedCount: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  summary: string;
  results: EntryLinkResult[];
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function isUrlOnDenyList(url: string, patterns: string[]): boolean {
  if (!patterns.length) return false;
  return urlMatchesAnyDomainPattern(url, patterns);
}

function isUrlAllowedByAllowList(url: string, patterns: string[]): boolean {
  if (!patterns.length) return true;
  return urlMatchesAnyDomainPattern(url, patterns);
}

function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types.'
    );
  }

  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

function getAvailableLocales(
  fieldValues: RichEntryField,
  targetLocale?: string,
  options: { skipMissingRequestedLocale?: boolean } = {}
): string[] {
  const availableLocales = Object.keys(fieldValues);
  const locales = targetLocale
    ? availableLocales.filter((itemLocale) => itemLocale === targetLocale)
    : availableLocales;

  if (targetLocale && locales.length === 0) {
    if (options.skipMissingRequestedLocale) {
      return [];
    }
    throw new Error('Requested locale is not available on the target field.');
  }

  return locales;
}

function buildEntryLike(
  contentTypeFields: ContentTypeField[],
  entryFields: Record<string, RichEntryField>,
  targetFieldId: string,
  targetLocale?: string
): EntryLike {
  const contentTypeField = contentTypeFields.find((field) => field.id === targetFieldId);
  if (!contentTypeField) {
    throw new Error(`Field ${targetFieldId} was not found on the content type.`);
  }

  const fieldValues = entryFields[targetFieldId];
  if (!fieldValues || typeof fieldValues !== 'object') {
    return { fields: {} };
  }

  const locales = getAvailableLocales(fieldValues, targetLocale);

  return {
    fields: {
      [targetFieldId]: {
        id: targetFieldId,
        name: contentTypeField.name || targetFieldId,
        type: contentTypeField.type,
        locales,
        getValue: (locale?: string) => {
          if (!locale) return undefined;
          return fieldValues[locale];
        },
      },
    },
  };
}

function buildEntryLikeForFields(
  contentTypeFields: ContentTypeField[],
  entryFields: Record<string, RichEntryField>,
  fieldIds?: string[],
  targetLocale?: string
): EntryLike {
  const supportedFieldTypes = new Set(['Symbol', 'Text', 'RichText', 'Array']);
  const requestedFieldIds = fieldIds?.filter(Boolean);
  const selectedFields =
    requestedFieldIds && requestedFieldIds.length > 0
      ? requestedFieldIds.map((fieldId) => {
          const field = contentTypeFields.find((item) => item.id === fieldId);
          if (!field) {
            throw new Error(`Field ${fieldId} was not found on the content type.`);
          }
          return field;
        })
      : contentTypeFields.filter((field) => supportedFieldTypes.has(field.type));

  const fields = selectedFields.reduce<Record<string, EntryLikeField>>((acc, field) => {
    const fieldValues = entryFields[field.id];
    if (!fieldValues || typeof fieldValues !== 'object') {
      return acc;
    }

    const locales = getAvailableLocales(fieldValues, targetLocale, {
      skipMissingRequestedLocale: true,
    });
    if (locales.length === 0) {
      return acc;
    }
    acc[field.id] = {
      id: field.id,
      name: field.name || field.id,
      type: field.type,
      locales,
      getValue: (locale?: string) => {
        if (!locale) return undefined;
        return fieldValues[locale];
      },
    };
    return acc;
  }, {});

  return { fields };
}

function buildSummary(
  entryId: string,
  fieldName: string,
  response: Omit<CheckEntryLinksResponse, 'summary'>
): string {
  const localeText = response.locale ? ` (${response.locale})` : '';
  const headline = `Link Checker scanned ${response.checkedCount} link(s) in ${fieldName}${localeText} on entry ${entryId}.`;
  const counts = `${response.validCount} valid, ${response.invalidCount} invalid, ${response.skippedCount} skipped.`;

  if (!response.results.length) {
    return `${headline} No links were found.`;
  }

  const details = response.results
    .map((result) => {
      const target = result.resolvedUrl ?? result.url;
      if (result.isBlockedByAllowList) {
        return `- ${target}: blocked by allow list`;
      }
      if (result.isOnDenyList) {
        return `- ${target}: blocked by deny list`;
      }
      if (result.error) {
        return `- ${target}: ${result.error}`;
      }
      if (result.status != null) {
        return `- ${target}: HTTP ${result.status}`;
      }
      return `- ${target}: no result`;
    })
    .join('\n');

  return `${headline} ${counts}\n${details}`;
}

async function checkExtractedUrls(
  extracted: ExtractedUrl[],
  installationParameters: AppInstallationParameters
): Promise<Omit<CheckEntryLinksResponse, 'entryId' | 'fieldId' | 'locale' | 'summary'>> {
  const explicitAllowedPatterns = (installationParameters.allowedUrlPatterns || '')
    .split(',')
    .map((pattern) => normalizeDomainPattern(pattern))
    .filter(Boolean);
  const forbiddenPatterns = (installationParameters.forbiddenUrlPatterns || '')
    .split(',')
    .map((pattern) => normalizeDomainPattern(pattern))
    .filter(Boolean);
  const baseUrl = (installationParameters.baseUrl || '').trim().replace(/\/$/, '') || null;

  const results: EntryLinkResult[] = [];
  let skippedCount = 0;

  for (const item of extracted) {
    let resolvedUrl = item.url;

    if (isRelativeUrl(item.url)) {
      if (!baseUrl) {
        skippedCount += 1;
        continue;
      }

      try {
        resolvedUrl = new URL(
          item.url,
          baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
        ).href;
      } catch {
        skippedCount += 1;
        continue;
      }
    }

    const isBlockedByAllowList = !isUrlAllowedByAllowList(resolvedUrl, explicitAllowedPatterns);
    const isOnDenyList = isUrlOnDenyList(resolvedUrl, forbiddenPatterns);

    if (isBlockedByAllowList || isOnDenyList) {
      results.push({
        ...item,
        resolvedUrl,
        isBlockedByAllowList,
        isOnDenyList,
        isValid: false,
        error: isBlockedByAllowList ? 'Not on allow list' : 'On deny list',
      });
      continue;
    }

    const checkResult = await checkUrl(resolvedUrl);
    const isValid = checkResult.status != null ? isSuccessStatus(checkResult.status) : false;

    results.push({
      ...item,
      ...checkResult,
      resolvedUrl,
      isBlockedByAllowList: false,
      isOnDenyList: false,
      isValid,
    });
  }

  const validCount = results.filter((result) => result.isValid).length;

  return {
    checkedCount: results.length,
    validCount,
    invalidCount: results.length - validCount,
    skippedCount,
    results,
  };
}

function buildAllFieldsSummary(response: CheckAllEntryLinksResponse): string {
  const localeText = response.locale ? ` (${response.locale})` : '';
  const fieldList =
    response.checkedFieldIds.length > 0 ? response.checkedFieldIds.join(', ') : 'no fields';
  const headline = `Link Checker scanned ${response.checkedCount} link(s) across ${response.checkedFieldIds.length} field(s)${localeText} on entry ${response.entryId}.`;
  const counts = `${response.validCount} valid, ${response.invalidCount} invalid, ${response.skippedCount} skipped.`;

  if (!response.results.length) {
    return `${headline} Checked fields: ${fieldList}. No links were found.`;
  }

  const details = response.results
    .map((result) => {
      const target = result.resolvedUrl ?? result.url;
      if (result.isBlockedByAllowList) {
        return `- ${result.fieldName} (${result.locale}): ${target} blocked by allow list`;
      }
      if (result.isOnDenyList) {
        return `- ${result.fieldName} (${result.locale}): ${target} blocked by deny list`;
      }
      if (result.error) {
        return `- ${result.fieldName} (${result.locale}): ${target} ${result.error}`;
      }
      if (result.status != null) {
        return `- ${result.fieldName} (${result.locale}): ${target} HTTP ${result.status}`;
      }
      return `- ${result.fieldName} (${result.locale}): ${target} no result`;
    })
    .join('\n');

  return `${headline} Checked fields: ${fieldList}. ${counts}\n${details}`;
}

export async function checkEntryFieldLinks(
  entryId: string,
  fieldId: string,
  locale: string | undefined,
  context: FunctionEventContext & {
    cma?: PlainClientAPI;
    appInstallationParameters?: AppInstallationParameters;
  }
): Promise<CheckEntryLinksResponse> {
  const cma = context.cma ?? initContentfulManagementClient(context);
  const entry = await cma.entry.get({ entryId });
  const contentTypeId = entry.sys.contentType.sys.id;
  const contentType = await cma.contentType.get({ contentTypeId });

  const entryLike = buildEntryLike(
    (contentType.fields || []) as ContentTypeField[],
    (entry.fields || {}) as Record<string, RichEntryField>,
    fieldId,
    locale
  );
  const extracted = extractUrlsFromEntry(entryLike);

  const counts = await checkExtractedUrls(extracted, context.appInstallationParameters || {});
  const fieldName = entryLike.fields[fieldId]?.name || fieldId;

  return {
    entryId,
    fieldId,
    locale,
    ...counts,
    summary: buildSummary(entryId, fieldName, {
      entryId,
      fieldId,
      locale,
      ...counts,
    }),
  };
}

export async function checkAllEntryLinks(
  entryId: string,
  locale: string | undefined,
  fieldIds: string[] | undefined,
  context: FunctionEventContext & {
    cma?: PlainClientAPI;
    appInstallationParameters?: AppInstallationParameters;
  }
): Promise<CheckAllEntryLinksResponse> {
  const cma = context.cma ?? initContentfulManagementClient(context);
  const entry = await cma.entry.get({ entryId });
  const contentTypeId = entry.sys.contentType.sys.id;
  const contentType = await cma.contentType.get({ contentTypeId });

  const entryLike = buildEntryLikeForFields(
    (contentType.fields || []) as ContentTypeField[],
    (entry.fields || {}) as Record<string, RichEntryField>,
    fieldIds,
    locale
  );
  const extracted = extractUrlsFromEntry(entryLike);
  const counts = await checkExtractedUrls(extracted, context.appInstallationParameters || {});
  const checkedFieldIds = Object.keys(entryLike.fields);

  const response: CheckAllEntryLinksResponse = {
    entryId,
    locale,
    checkedFieldIds,
    ...counts,
    summary: '',
  };
  response.summary = buildAllFieldsSummary(response);
  return response;
}

export const handler = async (
  event: CheckEntryLinksEvent,
  context: FunctionEventContext & {
    cma?: PlainClientAPI;
    appInstallationParameters?: AppInstallationParameters;
  }
): Promise<CheckEntryLinksResponse> => {
  const entryId = event?.body?.entryId?.trim();
  const fieldId = event?.body?.fieldId?.trim();
  const locale = event?.body?.locale?.trim();

  if (!entryId) {
    throw new Error('entryId is required');
  }
  if (!fieldId) {
    throw new Error('fieldId is required');
  }

  return checkEntryFieldLinks(entryId, fieldId, locale, context);
};
