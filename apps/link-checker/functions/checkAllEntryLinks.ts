import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { PlainClientAPI } from 'contentful-management';
import { checkAllEntryLinks, type CheckAllEntryLinksParameters, type CheckAllEntryLinksResponse } from './checkEntryLinks';

interface CheckAllEntryLinksEvent {
  body?: CheckAllEntryLinksParameters;
}

export const handler = async (
  event: CheckAllEntryLinksEvent,
  context: FunctionEventContext & {
    cma?: PlainClientAPI;
    appInstallationParameters?: {
      allowedUrlPatterns?: string;
      forbiddenUrlPatterns?: string;
      baseUrl?: string;
    };
  }
): Promise<CheckAllEntryLinksResponse> => {
  const entryId = event?.body?.entryId?.trim();
  const locale = event?.body?.locale?.trim();
  const fieldIds = event?.body?.fieldIds?.map((fieldId) => fieldId.trim()).filter(Boolean);

  if (!entryId) {
    throw new Error('entryId is required');
  }

  return checkAllEntryLinks(entryId, locale, fieldIds, context);
};
