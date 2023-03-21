export const DEFAULT_ERR_MSG = 'Oops! Cannot display the analytics data at this time.';
export const EMPTY_DATA_MSG = 'There are no page views to show for this range.';
export const DEFAULT_CONTENT_MSG = 'Oops! Something went wrong with the slug field configuration.';

export const getContentTypeSpecificMsg = (contentTypeName: string) => ({
  noSlugConfigMsg: `The ${contentTypeName} content type has not been configured for use with this app. It must have a field of type short text and must be added to the list of content types in
    this app's configuration.`,
  noSlugContentMsg: `This ${contentTypeName} entry does not have a valid slug field.`,
  notPublishedMsg: `This ${contentTypeName} entry has not yet been published.`,
});
