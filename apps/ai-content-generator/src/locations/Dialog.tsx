import useDialogParameters from '@hooks/dialog/useDialogParameters';
import { AIFeature } from '@configs/features/featureConfig';
import CommonGenerator from '@components/app/dialog/common-generator/CommonGenerator';
import GeneratorProvider from '@providers/generatorProvider';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useMemo } from 'react';

export interface FieldLocales {
  [key: string]: string[];
}

type DialogInvocationParameters = {
  feature: AIFeature;
  entryId: string;
  fieldLocales: FieldLocales;
};

const Dialog = () => {
  const { feature, entryId, isLoading, fieldLocales } = useDialogParameters();
  const sdk = useSDK<DialogAppSDK>();

  if (isLoading) {
    return null;
  }

  const localeNames = sdk.locales.names;
  const defaultLocale = sdk.locales.default;

  const GeneratorComponent = useMemo(() => {
    switch (feature) {
      case AIFeature.REWRITE:
        return CommonGenerator;
      default:
        return CommonGenerator;
    }
  }, [feature]);

  return (
    <GeneratorProvider
      feature={feature}
      entryId={entryId}
      fieldLocales={fieldLocales}
      localeNames={localeNames}
      defaultLocale={defaultLocale}>
      <GeneratorComponent />
    </GeneratorProvider>
  );
};

export default Dialog;
export type { DialogInvocationParameters };
