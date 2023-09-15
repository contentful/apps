import React from 'react';
import { useSidebarSlug } from 'hooks/useSidebarSlug/useSidebarSlug';
import Note from 'components/common/Note/Note';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { getContentTypeSpecificMsg } from 'components/main-app/constants/noteMessages';
import {
  SupportHyperLink,
  AppConfigPageHyperLink,
} from 'components/main-app/ErrorDisplay/CommonErrorDisplays';

interface Props {
  slugFieldInfo: ContentTypeValue;
  useTrailingSlash: boolean;
}

const SlugWarningDisplay = (props: Props) => {
  const { slugFieldInfo, useTrailingSlash } = props;
  const sdk = useSDK<SidebarExtensionSDK>();
  const contentTypeName = sdk.contentType.name;

  const { slugFieldIsConfigured, contentTypeHasSlugField, isPublished } = useSidebarSlug(
    slugFieldInfo,
    useTrailingSlash
  );

  const { noSlugConfigMsg, noSlugContentMsg, notPublishedMsg } =
    getContentTypeSpecificMsg(contentTypeName);

  const renderContent = () => {
    const content: { bodyMsg: string | JSX.Element } = { bodyMsg: <SupportHyperLink /> };
    if (!slugFieldIsConfigured) {
      content.bodyMsg = <AppConfigPageHyperLink bodyMsg={noSlugConfigMsg} />;
    } else if (!contentTypeHasSlugField) {
      content.bodyMsg = <AppConfigPageHyperLink bodyMsg={noSlugContentMsg} />;
    } else if (!isPublished) {
      content.bodyMsg = notPublishedMsg;
    }

    return content;
  };

  const { bodyMsg } = renderContent();

  return <Note body={bodyMsg} variant="warning" />;
};

export default SlugWarningDisplay;
