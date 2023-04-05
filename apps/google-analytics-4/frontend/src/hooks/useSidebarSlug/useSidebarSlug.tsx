import { useCallback, useEffect, useState } from 'react';
import { ContentTypeValue } from 'types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentEntitySys, SidebarExtensionSDK } from '@contentful/app-sdk';
import { pathJoin } from 'utils/pathJoin';
import useGetFieldValue from '../useGetFieldValue';

export const useSidebarSlug = (slugFieldInfo: ContentTypeValue) => {
  const sdk = useSDK<SidebarExtensionSDK>();

  const { slugField, urlPrefix } = slugFieldInfo;
  const slugFieldValue = useGetFieldValue(slugField);

  const [isPublished, setIsPublished] = useState(false);
  const [debouncedSlugFieldValue, setDebouncedSlugFieldValue] = useState(slugFieldValue);

  const handlePublishedStatus = (sys: ContentEntitySys) => {
    setIsPublished(Boolean(sys.publishedAt));
  };

  useEffect(() => {
    sdk.entry.onSysChanged((sys) => handlePublishedStatus(sys));
  }, [sdk.entry]);

  const updateSlugFieldValue = (v: string) => {
    setDebouncedSlugFieldValue(v);
  };

  const handleSlugField = useCallback(updateSlugFieldValue, [updateSlugFieldValue]);

  useEffect(() => {
    const timeout = setTimeout(() => handleSlugField(slugFieldValue), 500);

    return () => clearTimeout(timeout);
  }, [slugFieldValue, handleSlugField]);

  const reportSlug = `/${pathJoin(urlPrefix || '', debouncedSlugFieldValue || '')}`;
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
