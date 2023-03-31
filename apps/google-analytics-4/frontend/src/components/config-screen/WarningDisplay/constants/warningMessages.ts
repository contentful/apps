// Content type warning and error messages
export const NO_SLUG_WARNING_MSG = `This content type must have a slug field selected in order for the app to render correctly in the sidebar. `;
export const REMOVED_FROM_SIDEBAR_WARNING_MSG = `The app has been removed from the sidebar for this content type. If you would like to remove this
content type from the app configuration, remove this row and save. If you would like the app to be added back to the sidebar 
for this content type, just save the app configuration. `;

export const getContentTypeDeletedMsg = (contentTypeId: string): string => {
  return `The previously configured content type '${contentTypeId}' has been deleted. Please select a new content type or remove this row. `;
};

export const getSlugFieldDeletedMsg = (contentTypeId: string, slugField: string): string => {
  return `The previously configured slug field '${slugField}' has been deleted from the '${contentTypeId}' content type. 
  Please select a new slug field in order for the app to render correctly in the sidebar. `;
};

// Property selection warning and error messages
export const NO_PROPERTIES = `We couldn't find any Google Analytics 4 properties to display. See status checks above for possible errors.`;

export const getPropertyDeletedMsg = (propertyId: string): string => {
  return `The previously configured property (${propertyId}) is no longer available via the installed Google service account. Either ensure that the service account has access to this property or select a new property and save the configuration.`;
};

export enum WarningTypes {
  Empty = '',
  Error = 'error',
  Warning = 'warning',
}
