import { GeneratorReducer } from '@components/app/dialog/common-generator/generatorReducer';
import { AIFeature } from '@configs/features/featureConfig';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { Dispatch, createContext, useState } from 'react';

interface GeneratorContextProps {
  entryId: string;
  targetLocale: string;
  setProviderData: (data: Partial<GeneratorContextProps>) => void;

  entry: EntryProps | null;
  contentType: ContentTypeProps | null;

  dispatch: Dispatch<GeneratorReducer>;
  feature: AIFeature;
}

interface GeneratorProviderProps {
  entryId: string;

  children: React.ReactNode;
  feature: AIFeature;
}

const defaultContext = {
  entryId: '',
  targetLocale: '',
  setProviderData: (data: Partial<GeneratorContextProps>) => {},

  entry: null,
  contentType: null,

  dispatch: (() => {}) as Dispatch<GeneratorReducer>,
  feature: AIFeature.TITLE,
};

const GeneratorContext = createContext<GeneratorContextProps>(defaultContext);

const GeneratorProvider = (props: GeneratorProviderProps) => {
  const { entryId, children, feature } = props;
  const [providerData, setProviderData] = useState<GeneratorContextProps>({
    ...defaultContext,
    entryId,
    feature,
  });

  const updateProviderData = (newProviderData: Partial<GeneratorContextProps>) => {
    setProviderData({ ...providerData, ...newProviderData });
  };

  return (
    <GeneratorContext.Provider value={{ ...providerData, setProviderData: updateProviderData }}>
      {children}
    </GeneratorContext.Provider>
  );
};

export default GeneratorProvider;
export { GeneratorContext };
