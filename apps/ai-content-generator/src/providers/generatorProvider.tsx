import { GeneratorReducer } from '@components/app/dialog/common-generator/generatorReducer';
import { AIFeature } from '@configs/features/featureConfig';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { Dispatch, createContext, useContext, useState } from 'react';
import { FieldLocales } from '@locations/Dialog';
import { SegmentAction, SegmentEventData, SegmentEvents } from '@configs/segment/segmentEvent';
import { SegmentAnalyticsContext } from './segmentAnalyticsProvider';

export interface LocaleNames {
  [key: string]: string;
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
  trackGeneratorEvent: (event: SegmentEvents) => void;
  segmentEventData?: SegmentEventData;
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
  trackGeneratorEvent: (() => {}) as (event: SegmentEvents) => void,

  dispatch: (() => {}) as Dispatch<GeneratorReducer>,
  feature: AIFeature.TITLE,
};

const GeneratorContext = createContext<GeneratorContextProps>(defaultContext);

const GeneratorProvider = (props: GeneratorProviderProps) => {
  const { trackEvent } = useContext(SegmentAnalyticsContext);
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

  const trackGeneratorEvent = (event: SegmentEvents, action?: SegmentAction) => {
    trackEvent(event, { ...providerData.segmentEventData, action });
  };

  return (
    <GeneratorContext.Provider
      value={{
        ...providerData,
        setProviderData: updateProviderData,
        trackGeneratorEvent,
      }}>
      {children}
    </GeneratorContext.Provider>
  );
};

export default GeneratorProvider;
export { GeneratorContext };
