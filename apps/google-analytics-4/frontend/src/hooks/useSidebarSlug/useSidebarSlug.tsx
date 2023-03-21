import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { pathJoin } from 'utils/pathJoin';
import useGetFieldValue from '../useGetFieldValue';

export const useSidebarSlug = (slugFieldInfo: ContentTypeValue) => {
  const sdk = useSDK<SidebarExtensionSDK>();

  const { slugField, urlPrefix } = slugFieldInfo;
  const slugFieldValue = useGetFieldValue(slugField);

  const reportSlug = `/${pathJoin(urlPrefix || '', slugFieldValue || '')}`;
  const slugFieldIsConfigured = Boolean(slugField);
  const contentTypeHasSlugField = slugField in sdk.entry.fields;
  const isPublished = Boolean(sdk.entry.getSys().publishedAt);

  return {
    slugFieldIsConfigured,
    contentTypeHasSlugField,
    isPublished,
    reportSlug,
    slugFieldValue,
    isContentTypeWarning: !slugFieldIsConfigured || !contentTypeHasSlugField || !isPublished,
  };
};
