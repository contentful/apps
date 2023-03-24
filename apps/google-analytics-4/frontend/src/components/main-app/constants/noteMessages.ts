export const DEFAULT_ERR_MSG = 'Oops! Cannot display the analytics data at this time.';
export const EMPTY_DATA_MSG =
  'There are no page views to show for this range. If this is not expected, assure your URL prefix and slug value accurately reflect a page path within your Google Analytics instance.';
export const DEFAULT_CONTENT_MSG = 'Oops! Something went wrong with the slug field configuration.';
export const INVALID_ARGUMENT_MSG =
  'Invalid arguments provided. Please assure you have configured your property correctly on the app configuration page.';
export const PERMISSION_DENIED_MSG =
  'Permission denied. Please either enable your Google Analytics Data API or assure you have valid permissions.';

export const getContentTypeSpecificMsg = (contentTypeName: string) => ({
  noSlugConfigMsg: `The Google Analytics 4 sidebar app cannot be displayed on this entry because the ${contentTypeName} content type has not been correctly configured. Please configure this content type on the app configuration page.`,
  noSlugContentMsg: `This ${contentTypeName} entry does not have a valid slug field. Please add a field of type short text to this entry and configure it on the app configuration page.`,
  notPublishedMsg: `This ${contentTypeName} entry has not yet been published.`,
});
