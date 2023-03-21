import React from 'react';
import { useSidebarSlug } from 'hooks/useSidebarSlug/useSidebarSlug';
import Note from 'components/common/Note/Note';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { getContentTypeSpecificMsg, DEFAULT_CONTENT_MSG } from '../constants/noteMessages';

interface Props {
  slugFieldInfo: ContentTypeValue;
}

const SlugWarningDisplay = (props: Props) => {
  const { slugFieldInfo } = props;
  const sdk = useSDK<SidebarExtensionSDK>();
  const contentTypeName = sdk.contentType.name;

  const { slugFieldIsConfigured, contentTypeHasSlugField, isPublished } =
    useSidebarSlug(slugFieldInfo);

  const { noSlugConfigMsg, noSlugContentMsg, notPublishedMsg } =
    getContentTypeSpecificMsg(contentTypeName);

  const renderBodyMsg = () => {
    if (!slugFieldIsConfigured) {
      return noSlugConfigMsg;
    }

    if (!contentTypeHasSlugField) {
      return noSlugContentMsg;
    }

    if (!isPublished) {
      return notPublishedMsg;
    }

    return DEFAULT_CONTENT_MSG;
  };

  return <Note body={renderBodyMsg()} variant="warning" />;
};

export default SlugWarningDisplay;
