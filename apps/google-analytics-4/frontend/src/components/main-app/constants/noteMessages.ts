export const DEFAULT_ERR_MSG =
  'An unknown error has occurred. Please try again or contact support.';
export const EMPTY_DATA_MSG =
  'There are no page views to show for this range. If this is not expected, ensure the URL prefix and slug value accurately reflect a page path within your Google Analytics account.';
export const INVALID_ARGUMENT_MSG =
  'Invalid arguments provided. Please ensure you have configured your property correctly on the app configuration page.';
export const PERMISSION_DENIED_MSG =
  'Permission denied. Please either enable your Google Analytics Data API or ensure you have valid permissions.';
export const INVALID_SERVICE_ACCOUNT =
  'Invalid service key. Please ensure you have configured your service account correctly on the app configuration page.';

export const getContentTypeSpecificMsg = (contentTypeName: string) => ({
  noSlugConfigMsg: `The Google Analytics 4 sidebar app cannot be displayed on this entry because the ${contentTypeName} content type has not been correctly configured. Please configure this content type on the app configuration page.`,
  noSlugContentMsg: `This ${contentTypeName} entry does not have a valid slug field. Please add a field of type short text to this entry and configure it on the app configuration page.`,
  notPublishedMsg: `This ${contentTypeName} entry has not yet been published. Please publish the entry to view this Google Analytics 4 sidebar app.`,
});

export const getMissingParamsMsg = (
  serviceAccountKeyMissing: boolean,
  propertyIdMissing: boolean
) => {
  const serviceAccountMsg = 'Service Account Key';
  const propertyMsg = 'Google Analytics 4 property';
  let missingParams = '';

  if (serviceAccountKeyMissing && propertyIdMissing)
    missingParams = `${serviceAccountMsg} and ${propertyMsg}`;
  else if (serviceAccountKeyMissing) missingParams = `${serviceAccountMsg}`;
  else if (propertyIdMissing) missingParams = `${propertyMsg}`;

  return `No ${missingParams} provided or found in app installation parameters. Please update your app configuration page. `;
};
