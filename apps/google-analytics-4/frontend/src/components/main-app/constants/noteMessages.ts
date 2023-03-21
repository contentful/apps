export const DEFAULT_ERR_MSG = 'Oops! Cannot display the analytics data at this time.';
export const EMPTY_DATA_MSG = 'There are no page views to show for this range.';
export const DEFAULT_CONTENT_MSG = 'Oops! Something went wrong with the slug field configuration.';

export const getContentTypeSpecificMsg = (contentTypeName: string) => ({
  noSlugConfigMsg: `The Google Analytics 4 sidebar app cannot be displayed on this entry because the ${contentTypeName} content type has not been correctly configured. Please configure this content type on the app configuration page.`,
  noSlugContentMsg: `This ${contentTypeName} entry does not have a valid slug field. Please add a field of type short text to this entry and configure it on the app configuration page.`,
  notPublishedMsg: `This ${contentTypeName} entry has not yet been published.`,
});
