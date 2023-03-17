export const NO_CONTENT_TYPE_ERR_MSG = `Please select a content type or remove this row to in order to save the configuration. `;
export const NO_SLUG_WARNING_MSG = `This content type must have a slug field selected in order for the app to render correctly in the sidebar. `;
export const REMOVED_FROM_SIDEBAR_WARNING_MSG = `The app has been removed from the sidebar for this content type. If you would like to remove this
content type from the app configuration, remove this row and save. If you would like the app to be added back to the sidebar 
for this content type, just save the app configuration. `;

export const getContentTypeDeletedMsg = (contentTypeId: string): string => {
  return `The previously configured content type '${contentTypeId}' has been deleted. Please select a new content type or remove this row in order to save the configuration. `;
};

export const getSlugFieldDeletedMsg = (contentTypeId: string, slugField: string): string => {
  return `The previously configured slug field '${slugField}' has been deleted from the '${contentTypeId}' content type. 
  Please select a new slug field in order for the app to render correctly in the sidebar. `;
};

export enum WarningTypes {
  Empty = '',
  Error = 'error',
  Warning = 'warning',
}
