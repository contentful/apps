import React from 'react';
import { useSidebarSlug } from 'hooks/useSidebarSlug/useSidebarSlug';
import { TextLink } from '@contentful/f36-components';
import Note from 'components/common/Note/Note';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { getContentTypeSpecificMsg, DEFAULT_CONTENT_MSG } from '../constants/noteMessages';

const HYPER_LINK_MSG = 'app configuration page.';
interface Props {
  slugFieldInfo: ContentTypeValue;
}

const SlugWarningDisplay = (props: Props) => {
  const { slugFieldInfo } = props;
  const sdk = useSDK<SidebarExtensionSDK>();
  const contentTypeName = sdk.contentType.name;

  const openConfigPage = () => sdk.navigator.openAppConfig();
  const linkToOpenConfigPage = (
    <TextLink onClick={openConfigPage} target="_blank" rel="noopener noreferer">
      {HYPER_LINK_MSG}
    </TextLink>
  );

  const { slugFieldIsConfigured, contentTypeHasSlugField, isPublished } =
    useSidebarSlug(slugFieldInfo);

  const showHyperlink = !slugFieldIsConfigured || !contentTypeHasSlugField;
  const { noSlugConfigMsg, noSlugContentMsg, notPublishedMsg } = getContentTypeSpecificMsg(
    contentTypeName,
    showHyperlink
  );

  const renderContent = () => {
    const content = { bodyMsg: DEFAULT_CONTENT_MSG, children: <></> };
    if (!slugFieldIsConfigured) {
      content.bodyMsg = noSlugConfigMsg;
      content.children = linkToOpenConfigPage;
    } else if (!contentTypeHasSlugField) {
      content.bodyMsg = noSlugContentMsg;
      content.children = linkToOpenConfigPage;
    } else if (!isPublished) {
      content.bodyMsg = notPublishedMsg;
    }

    return content;
  };

  const { bodyMsg, children } = renderContent();

  return (
    <Note body={bodyMsg} variant="warning">
      {children}
    </Note>
  );
};

export default SlugWarningDisplay;
