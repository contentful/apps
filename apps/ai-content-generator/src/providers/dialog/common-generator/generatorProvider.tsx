import { GeneratorReducer } from '@components/dialog/common-generator/generatorReducer';
import { Prompt } from '@configs/features/featureTypes';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { Dispatch, createContext, useState } from 'react';

interface GeneratorContextProps {
  entryId: string;
  targetLocale: string;
  prompt: Prompt;
  setProviderData: (data: Partial<GeneratorContextProps>) => void;

  entry: EntryProps | null;
  contentType: ContentTypeProps | null;

  dispatch: Dispatch<GeneratorReducer>;
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

interface GeneratorProviderProps {
  entryId: string;
  prompt: Prompt;

  children: React.ReactNode;
}
const GeneratorProvider = (props: GeneratorProviderProps) => {
  const { entryId, prompt, children } = props;
  const [providerData, setProviderData] = useState<GeneratorContextProps>({
    ...defaultContext,
    entryId,
    prompt,
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
