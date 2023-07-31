import useDialogParameters from '@hooks/dialog/useDialogParameters';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import CommonGenerator from '@components/app/dialog/common-generator/CommonGenerator';
import GeneratorProvider from '@providers/generatorProvider';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';

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

  const getGenerator = (feature: AIFeature) => {
    switch (feature) {
      case AIFeature.TRANSLATE:
        return <CommonGenerator isTranslate />;

      case AIFeature.TITLE:
        return <CommonGenerator isTitle />;

      default:
        return <CommonGenerator />;
    }
  };

  return (
    <GeneratorProvider
      feature={feature}
      entryId={entryId}
      fieldLocales={fieldLocales}
      localeNames={localeNames}>
      {getGenerator(feature)}
    </GeneratorProvider>
  );
};

export default Dialog;
export type { DialogInvocationParameters };
