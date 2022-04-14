import { ContentTypeProps, PlainClientAPI } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';

const SHORT_TEXT_TYPE = 'Symbol';

export const filterShortTextFieldCTs = (cts: ContentTypeProps[]) => {
  return cts.filter((ct) => {
    return ct.fields.find((field) => field.type === SHORT_TEXT_TYPE);
  });
};

export const setInitialFieldContentTypes = (
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
      // go through all editor interfaces and see if the field contains the current app
      const assignedCTs = editorInterfaces.items
        .filter((ei) => {
          const fieldWidget = ei.controls?.find(
            (item) => item.widgetId === sdk.ids.app && item.widgetNamespace === 'app'
          );
          return !!fieldWidget;
        })
        .map((ei) => ei.sys.contentType.sys.id);
      setSelectedCTs(assignedCTs);
    })();
  };
};

export const buildFieldTargetState = (selectedFieldCTs: string[], fieldCTs: ContentTypeProps[]) => {
  return selectedFieldCTs.reduce((acc, ct) => {
    const fullCT = fieldCTs.find((item) => item.sys.id === ct);
    if (!fullCT) {
      return acc;
    }

    const shortTextFields = fullCT.fields
      .filter((field) => field.type === SHORT_TEXT_TYPE)
      .map((field) => field.id);
    return {
      ...acc,
      [ct]: {
        controls: shortTextFields.map((field) => ({ fieldId: field })),
      },
    };
  }, {});
};
