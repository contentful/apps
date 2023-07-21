import { GeneratorReducer } from '@components/app/dialog/common-generator/generatorReducer';
import { Prompt } from '@configs/features/featureTypes';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { Dispatch, createContext, useState } from 'react';
import { AIFeature } from '../configs/features/featureConfig';

interface GeneratorContextProps {
  entryId: string;
  targetLocale: string;
  prompt: Prompt;
  setProviderData: (data: Partial<GeneratorContextProps>) => void;

  entry: EntryProps | null;
  contentType: ContentTypeProps | null;

  dispatch: Dispatch<GeneratorReducer>;
  feature: AIFeature;
}

interface GeneratorProviderProps {
  entryId: string;
  prompt: Prompt;
  feature: AIFeature;

  children: React.ReactNode;
}

const defaultContext = {
  entryId: '',
  targetLocale: '',
  prompt: (() => '') as Prompt,
  setProviderData: (data: Partial<GeneratorContextProps>) => {},

  entry: null,
  contentType: null,

  dispatch: (() => {}) as Dispatch<GeneratorReducer>,
};

const GeneratorContext = createContext<GeneratorContextProps>(defaultContext);

const GeneratorProvider = (props: GeneratorProviderProps) => {
  const { entryId, prompt, children, feature } = props;
  const [providerData, setProviderData] = useState<GeneratorContextProps>({
    ...defaultContext,
    entryId,
    prompt,
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
