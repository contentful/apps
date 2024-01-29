import { GeneratorReducer } from '@components/app/dialog/common-generator/generatorReducer';
import { AIFeature } from '@configs/features/featureConfig';
import { FieldLocales } from '@locations/Dialog';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { Dispatch, createContext, useState } from 'react';

export interface LocaleNames {
  [key: string]: string;
}

// taken from original SegmentEventData
export interface GeneratorState {
  feature_id?: string;
  from_prompt?: boolean;
  content_generation_prompt?: string;
  source_field?: string;
  target_locale?: string;
  rewrite_prompt?: string;
}

interface GeneratorContextProps {
  entryId: string;
  setProviderData: (data: Partial<GeneratorContextProps>) => void;

  entry: EntryProps | null;
  contentType: ContentTypeProps | null;
  fieldLocales: FieldLocales;
  localeNames: LocaleNames;
  defaultLocale: string;

  dispatch: Dispatch<GeneratorReducer>;
  state?: GeneratorState;
  feature: AIFeature;
}

interface GeneratorProviderProps {
  entryId: string;

  fieldLocales: FieldLocales;
  localeNames: LocaleNames;
  defaultLocale: string;

  children: React.ReactNode;
  feature: AIFeature;
}

const defaultContext = {
  entryId: '',
  setProviderData: (() => {}) as (data: Partial<GeneratorContextProps>) => void,

  entry: null,
  contentType: null,
  fieldLocales: {},
  localeNames: {},
  defaultLocale: '',

  dispatch: (() => {}) as Dispatch<GeneratorReducer>,
  feature: AIFeature.TITLE,
};

const GeneratorContext = createContext<GeneratorContextProps>(defaultContext);

const GeneratorProvider = (props: GeneratorProviderProps) => {
  const { entryId, children, feature, fieldLocales, localeNames, defaultLocale } = props;
  const [providerData, setProviderData] = useState<GeneratorContextProps>({
    ...defaultContext,
    entryId,
    feature,
    fieldLocales,
    localeNames,
    defaultLocale,
  });

  const updateProviderData = (newProviderData: Partial<GeneratorContextProps>) => {
    setProviderData({ ...providerData, ...newProviderData });
  };

  return (
    <GeneratorContext.Provider
      value={{
        ...providerData,
        setProviderData: updateProviderData,
      }}>
      {children}
    </GeneratorContext.Provider>
  );
};

export default GeneratorProvider;
export { GeneratorContext };
