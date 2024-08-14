import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppEventEntry,
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import type { EntryProps } from 'contentful-management';

function hasAnyFieldsWithData(entry: EntryProps): boolean {
  return entry.fields && Object.values(entry.fields).some((field) => field);
}

export const handler: EventHandler<'appevent.filter'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const { appInstallationParameters } = context;
  const { body } = event as AppEventEntry;
  const result =
    hasAnyFieldsWithData(body) &&
    appInstallationParameters.contentTypes?.split(',').includes(body.sys.contentType.sys.id);
  console.log({ result });
  return { result };
};
