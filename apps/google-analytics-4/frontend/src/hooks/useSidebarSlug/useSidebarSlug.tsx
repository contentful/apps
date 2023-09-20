import { useEffect, useState } from 'react';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentEntitySys, SidebarExtensionSDK } from '@contentful/app-sdk';
import { pathJoin } from 'utils/pathJoin';
import useGetFieldValue from '../useGetFieldValue';
import { AppInstallationParameters } from 'types';

const SLUG_FIELD_INPUT_DELAY = 500;

export const useSidebarSlug = (slugFieldInfo: ContentTypeValue) => {
  const sdk = useSDK<SidebarExtensionSDK>();

  const { forceTrailingSlash } = sdk.parameters.installation as AppInstallationParameters;

  const { slugField, urlPrefix } = slugFieldInfo;
  const slugFieldValue = useGetFieldValue(slugField);

  const [isPublished, setIsPublished] = useState(false);
  const [debouncedSlugFieldValue, setDebouncedSlugFieldValue] = useState(slugFieldValue);

  const handlePublishedStatus = (sys: ContentEntitySys) => {
    setIsPublished(Boolean(sys.publishedAt));
  };

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSlugFieldValue(slugFieldValue),
      SLUG_FIELD_INPUT_DELAY
    );

    return () => clearTimeout(timeout);
  }, [slugFieldValue]);

  useEffect(() => {
    sdk.entry.onSysChanged((sys) => handlePublishedStatus(sys));
  }, [sdk.entry]);

  const reportSlug = `/${pathJoin(urlPrefix || '', debouncedSlugFieldValue || '')}${
    forceTrailingSlash ? '/' : ''
  }`;
  const slugFieldIsConfigured = Boolean(slugField);
  const contentTypeHasSlugField = slugField in sdk.entry.fields;

  return {
    slugFieldIsConfigured,
    contentTypeHasSlugField,
    isPublished,
    reportSlug,
    slugFieldValue: debouncedSlugFieldValue,
    isContentTypeWarning: !slugFieldIsConfigured || !contentTypeHasSlugField || !isPublished,
  };
};
