import {
  FunctionEventHandler,
  FunctionTypeEnum,
  AppEventRequest,
  EntryCreateEventPayload,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';
import { initContentfulManagementClient } from './initContentfulManagementClient';
import { AppInstallationParameters } from './types';

type ExtendedFunctionEventContext = FunctionEventContext<AppInstallationParameters> & {
  appDefinitionId: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: ExtendedFunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);
  const appInstallationParameters = context.appInstallationParameters as AppInstallationParameters;

  const appDefinitionId = context.appDefinitionId;

  const contentfulTopic = event.headers['X-Contentful-Topic'];
  if (contentfulTopic.includes('Entry.create')) {
    const entryEvent = event.body as EntryCreateEventPayload;
    const contentTypeId = entryEvent.sys.contentType.sys.id;

    console.log(entryEvent);

    const editorInterface = await cma.editorInterface.get({ contentTypeId });
    if (editorInterface.controls?.length > 0) {
      const fieldsUsingApp = editorInterface.controls.filter(
        (control) => control.widgetNamespace === 'app' && control.widgetId === appDefinitionId
      );

      if (fieldsUsingApp.length > 0) {
        await Promise.all(
          fieldsUsingApp.map(async (field) => {
            // TODO: Update internal name
            console.log({ field });
          })
        );

        console.log('Updated internal name');
      } else {
        console.log('No update internal name');
      }
    }
  }
};
