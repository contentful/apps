import React from 'react';
import { useSidebarSlug } from 'hooks/useSidebarSlug';
import Note from 'components/common/Note/Note';
import { ContentTypeValue } from 'types';

interface Props {
  slugFieldInfo: ContentTypeValue;
}

const NO_SLUG_CONFIG_MSG = `The content type has not been configured for use with this app. It must have a field of type short text and must be added to the list of content types in
this app's configuration.`;
const NO_SLUG_CONTENT_MSG = 'This entry does not have a valid slug field.';
const NOT_PUBLISHED_MSG = 'This entry has not yet been published.';
const DEFAULT_CONTENT_MSG = 'Oops! Something went wrong with the slug field configuration.';

const ErrorDisplay = (props: Props) => {
  const { slugFieldInfo } = props;

  const { slugFieldIsConfigured, contentTypeHasSlugField, isPublished } =
    useSidebarSlug(slugFieldInfo);

  const renderBodyMsg = () => {
    switch (true) {
      case !slugFieldIsConfigured:
        return NO_SLUG_CONFIG_MSG;
      case !contentTypeHasSlugField:
        return NO_SLUG_CONTENT_MSG;
      case !isPublished:
        return NOT_PUBLISHED_MSG;
      default:
        return DEFAULT_CONTENT_MSG;
    }
  };

  return <Note body={renderBodyMsg()} variant="warning" />;
};

export default ErrorDisplay;
