import { createContext } from 'react';
import { ContentTypeProps } from 'contentful-management';
import useGetContentTypes from '@hooks/useGetContentTypes';
import useGetLinkForContentTypeConfig from '@hooks/useGetContentTypeConfigLink';

interface ContentTypeContextValue {
  contentTypes: ContentTypeProps[];
  loading: boolean;
  error?: Error;
  contentTypeConfigLink: string;
}

interface ContentTypeContextProviderProps {
  children: React.ReactNode;
}

export const ContentTypeContext = createContext({} as ContentTypeContextValue);

export const ContentTypeContextProvider = (props: ContentTypeContextProviderProps) => {
  const { children } = props;
  const { contentTypes, loading, error } = useGetContentTypes();
  const contentTypeConfigLink = useGetLinkForContentTypeConfig();

  return (
    <ContentTypeContext.Provider
      value={{
        contentTypes,
        loading: loading,
        error: error,
        contentTypeConfigLink,
      }}>
      {children}
    </ContentTypeContext.Provider>
  );
};
