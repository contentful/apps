import { ContentTypeProps, PlainClientAPI } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';

// For this case, we only care about short text fields
const SHORT_TEXT_TYPE = 'Symbol';

export const filterShortTextFieldCTs = (cts: ContentTypeProps[]) => {
  return cts.filter((ct) => {
    return ct.fields.find((field) => field.type === SHORT_TEXT_TYPE);
  });
};

// Initially, we need to go through all content types
// and set the ones with the app assigned to its short
// text fields with checkbox as selected
export const getInitialFieldContentTypes = async (cma: PlainClientAPI, sdk: AppExtensionSDK) => {
  const editorInterfaces = await cma.editorInterface.getMany({
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
  });
  // go through all editor interfaces and see if the field contains the current app
  return editorInterfaces.items
    .filter((ei) => {
      const fieldWidget = ei.controls?.find(
        (item) => item.widgetId === sdk.ids.app && item.widgetNamespace === 'app'
      );
      return !!fieldWidget;
    })
    .map((ei) => ei.sys.contentType.sys.id);
};

// building the final state to save
// we replace all fields with type short text
// for all selected content types
// You could also build a select tree for each field
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
