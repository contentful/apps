import CommonGenerator from '@components/app/dialog/common-generator/CommonGenerator';
import RewriteGenerator from '@components/app/dialog/rewrite-generator/RewriteGenerator';
import { AIFeature } from '@configs/features/featureConfig';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import useDialogParameters from '@hooks/dialog/useDialogParameters';
import GeneratorProvider from '@providers/generatorProvider';

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

  useAutoResizer();

  if (isLoading) {
    return null;
  }

  const localeNames = sdk.locales.names;
  const defaultLocale = sdk.locales.default;

  const getGenerator = (feature: AIFeature) => {
    switch (feature) {
      case AIFeature.REWRITE:
        return <RewriteGenerator />;

      default:
        return <CommonGenerator />;
    }
  };

  return (
    <GeneratorProvider
      feature={feature}
      entryId={entryId}
      fieldLocales={fieldLocales}
      localeNames={localeNames}
      defaultLocale={defaultLocale}>
      {getGenerator(feature)}
    </GeneratorProvider>
  );
};

export default Dialog;
export type { DialogInvocationParameters };
