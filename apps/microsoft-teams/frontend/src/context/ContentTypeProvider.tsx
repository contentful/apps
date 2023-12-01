import { createContext } from 'react';
import { ContentTypeProps } from 'contentful-management';
import useGetContentTypes from '@hooks/useGetContentTypes';
import useGetLinkForContentTypeConfig from '@hooks/useGetContentTypeConfigLink';

interface ContentTypeContextValue {
  contentTypes: ContentTypeProps[];
  contentTypeConfigLink: string;
}

interface ContentTypeContextProviderProps {
  children: React.ReactNode;
}

export const ContentTypeContext = createContext({} as ContentTypeContextValue);

export const ContentTypeContextProvider = (props: ContentTypeContextProviderProps) => {
  const { children } = props;
  const contentTypes = useGetContentTypes();
  const contentTypeConfigLink = useGetLinkForContentTypeConfig();

  return (
    <ContentTypeContext.Provider value={{ contentTypes, contentTypeConfigLink }}>
      {children}
    </ContentTypeContext.Provider>
  );
};
