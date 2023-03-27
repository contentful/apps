import React from 'react';
import { useSidebarSlug } from 'hooks/useSidebarSlug/useSidebarSlug';
import Note from 'components/common/Note/Note';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { getContentTypeSpecificMsg, DEFAULT_ERR_MSG } from '../constants/noteMessages';
import HyperLink from 'components/common/HyperLink/HyperLink';

interface Props {
  slugFieldInfo: ContentTypeValue;
}

const SlugWarningDisplay = (props: Props) => {
  const { slugFieldInfo } = props;
  const sdk = useSDK<SidebarExtensionSDK>();
  const contentTypeName = sdk.contentType.name;

  const openConfigPage = () => sdk.navigator.openAppConfig();
  const appConfigPageHyperLink = (bodyMsg: string) => (
    <HyperLink onClick={openConfigPage} body={bodyMsg} substring="app configuration page." />
  );

  const supportHyperLink = (
    <HyperLink
      body={DEFAULT_ERR_MSG}
      substring="contact support."
      hyperLinkHref="https://www.contentful.com/support/?utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help"
    />
  );

  const { slugFieldIsConfigured, contentTypeHasSlugField, isPublished } =
    useSidebarSlug(slugFieldInfo);

  const { noSlugConfigMsg, noSlugContentMsg, notPublishedMsg } =
    getContentTypeSpecificMsg(contentTypeName);

  const renderContent = () => {
    const content: { bodyMsg: string | JSX.Element } = { bodyMsg: supportHyperLink };
    if (!slugFieldIsConfigured) {
      content.bodyMsg = appConfigPageHyperLink(noSlugConfigMsg);
    } else if (!contentTypeHasSlugField) {
      content.bodyMsg = appConfigPageHyperLink(noSlugContentMsg);
    } else if (!isPublished) {
      content.bodyMsg = notPublishedMsg;
    }

    return content;
  };

  const { bodyMsg } = renderContent();

  return <Note body={bodyMsg} variant="warning" />;
};

export default SlugWarningDisplay;
