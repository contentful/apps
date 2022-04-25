import { PlainClientAPI } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';

// Find all content types with the app assigned to the sidebar
// and preselect them in the list of content type on initial load
export const getInitialSidebarContentTypes = async (cma: PlainClientAPI, sdk: AppExtensionSDK) => {
  const editorInterfaces = await cma.editorInterface.getMany({
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
  });
  // go through all editor interfaces and see if the sidebar contains the current app
  return editorInterfaces.items
    .filter((ei) => {
      const sidebarWidget = ei.sidebar?.find(
        (item) => item.widgetId === sdk.ids.app && item.widgetNamespace === 'app'
      );
      return !!sidebarWidget;
    })
    .map((ei) => ei.sys.contentType.sys.id);
};
