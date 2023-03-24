import React from 'react';
import { useSidebarSlug } from 'hooks/useSidebarSlug/useSidebarSlug';
import Note from 'components/common/Note/Note';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { getContentTypeSpecificMsg, DEFAULT_CONTENT_MSG } from '../constants/noteMessages';
import HyperLink from 'components/common/HyperLink/HyperLink';

interface Props {
  slugFieldInfo: ContentTypeValue;
}

const SlugWarningDisplay = (props: Props) => {
  const { slugFieldInfo } = props;
  const sdk = useSDK<SidebarExtensionSDK>();
  const contentTypeName = sdk.contentType.name;

  const openConfigPage = () => sdk.navigator.openAppConfig();

  const { slugFieldIsConfigured, contentTypeHasSlugField, isPublished } =
    useSidebarSlug(slugFieldInfo);

  const { noSlugConfigMsg, noSlugContentMsg, notPublishedMsg } =
    getContentTypeSpecificMsg(contentTypeName);

  const renderContent = () => {
    const content = { bodyMsg: DEFAULT_CONTENT_MSG, hyperLink: true };
    if (!slugFieldIsConfigured) {
      content.bodyMsg = noSlugConfigMsg;
    } else if (!contentTypeHasSlugField) {
      content.bodyMsg = noSlugContentMsg;
    } else if (!isPublished) {
      content.bodyMsg = notPublishedMsg;
      content.hyperLink = false;
    }

    return content;
  };

  const { bodyMsg, hyperLink } = renderContent();

  return (
    <Note
      body={
        <>
          {hyperLink ? (
            <HyperLink
              onClick={openConfigPage}
              body={bodyMsg}
              substring="app configuration page."
            />
          ) : (
            bodyMsg
          )}
        </>
      }
      variant="warning"
    />
  );
};

export default SlugWarningDisplay;
