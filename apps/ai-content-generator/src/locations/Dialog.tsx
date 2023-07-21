import useDialogParameters from '@hooks/dialog/useDialogParameters';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import CommonGenerator from '@components/app/dialog/common-generator/CommonGenerator';
import GeneratorProvider from '@providers/generatorProvider';

type DialogInvocationParameters = {
  feature: AIFeature;
  entryId: string;
};

const Dialog = () => {
  const { feature, entryId, isLoading } = useDialogParameters();

  if (isLoading) {
    return null;
  }

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
    <GeneratorProvider entryId={entryId} prompt={featureConfig[feature].prompt}>
      {getGenerator(feature)}
    </GeneratorProvider>
  );
};

export default Dialog;
export type { DialogInvocationParameters };
