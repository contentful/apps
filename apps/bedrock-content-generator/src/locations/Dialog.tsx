import CommonGenerator from '@components/app/dialog/common-generator/CommonGenerator';
import RewriteGenerator from '@components/app/dialog/rewrite-generator/RewriteGenerator';
import { AIFeature } from '@configs/features/featureConfig';
import AppInstallationParameters from '@components/config/appInstallationParameters';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import useDialogParameters from '@hooks/dialog/useDialogParameters';
import GeneratorProvider from '@providers/generatorProvider';
import featureConfig from '@configs/features/featureConfig';
import { Note, Text } from '@contentful/f36-components';

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
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();

  useAutoResizer();

  if (isLoading) {
    return null;
  }

  // Validate that the requested feature is enabled
  const { enabledFeatures } = sdk.parameters.installation;
  const allFeatures = Object.keys(featureConfig) as AIFeature[];
  const enabledFeaturesList =
    enabledFeatures && enabledFeatures.length > 0 ? enabledFeatures : allFeatures; // Default to all features for backward compatibility

  if (!enabledFeaturesList.includes(feature)) {
    return (
      <Note variant="negative" title="Feature not available">
        <Text>
          The &quot;{featureConfig[feature]?.buttonTitle || feature}&quot; feature is not enabled in
          the app configuration. Please contact your administrator to enable this feature.
        </Text>
      </Note>
    );
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
