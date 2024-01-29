import { ReactNode, createContext, useMemo } from 'react';
import useSWR from 'swr';
import { useCMA } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';

interface ContentTypeListContextType {
  allContentTypesMap?: Record<string, ContentTypeProps>;
}

export const ContentTypeListContext = createContext<ContentTypeListContextType>({});

export const ContentTypeListContextProvider = ({ children }: { children: ReactNode }) => {
  const cma = useCMA();

  const { data: allContentTypes } = useSWR('content-types', cma.contentType.getMany, {});

  const allContentTypesMap = useMemo(() => {
    return (allContentTypes?.items || []).reduce((result, item) => {
      result[item.sys.id] = item;
      return result;
    }, {} as Record<string, ContentTypeProps>);
  }, [allContentTypes?.items]);

  return (
    <ContentTypeListContext.Provider
      value={{
        allContentTypesMap,
      }}>
      {children}
    </ContentTypeListContext.Provider>
  );
};
