import { PlainClientAPI } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';

export const setInitialSidebarContentTypes = (
  cma: PlainClientAPI,
  sdk: AppExtensionSDK,
  setSelectedCTs: (cts: string[]) => void
) => {
  return () => {
    (async () => {
      const editorInterfaces = await cma.editorInterface.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      });
      // go through all editor interfaces and see if the sidebar contains the current app
      const assignedCTs = editorInterfaces.items
        .filter((ei) => {
          const sidebarWidget = ei.sidebar?.find(
            (item) => item.widgetId === sdk.ids.app && item.widgetNamespace === 'app'
          );
          return !!sidebarWidget;
        })
        .map((ei) => ei.sys.contentType.sys.id);
      setSelectedCTs(assignedCTs);
    })();
  };
};
