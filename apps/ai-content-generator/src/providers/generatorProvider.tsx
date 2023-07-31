import { GeneratorReducer } from '@components/app/dialog/common-generator/generatorReducer';
import { AIFeature } from '@configs/features/featureConfig';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { Dispatch, createContext, useState } from 'react';
import { FieldLocales } from '@locations/Dialog';

export interface LocaleNames {
  [key: string]: string;
}

interface GeneratorContextProps {
  entryId: string;
  targetLocale: string;
  setProviderData: (data: Partial<GeneratorContextProps>) => void;

  entry: EntryProps | null;
  contentType: ContentTypeProps | null;
  fieldLocales: FieldLocales;
  localeNames: LocaleNames;

  dispatch: Dispatch<GeneratorReducer>;
  feature: AIFeature;
}

interface GeneratorProviderProps {
  entryId: string;

  fieldLocales: FieldLocales;
  localeNames: LocaleNames;

  children: React.ReactNode;
  feature: AIFeature;
}

const defaultContext = {
  entryId: '',
  targetLocale: '',
  setProviderData: (data: Partial<GeneratorContextProps>) => {},

  entry: null,
  contentType: null,
  fieldLocales: {},
  localeNames: {},

  dispatch: (() => {}) as Dispatch<GeneratorReducer>,
  feature: AIFeature.TITLE,
};

const GeneratorContext = createContext<GeneratorContextProps>(defaultContext);

const GeneratorProvider = (props: GeneratorProviderProps) => {
  const { entryId, children, feature, fieldLocales, localeNames } = props;
  const [providerData, setProviderData] = useState<GeneratorContextProps>({
    ...defaultContext,
    entryId,
    feature,
    fieldLocales,
    localeNames,
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
