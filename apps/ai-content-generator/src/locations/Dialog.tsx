import useDialogParameters from '@hooks/dialog/useDialogParameters';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import { Spinner } from '@contentful/f36-components';
import CommonGenerator from '@components/dialog/common-generator/CommonGenerator';

type DialogInvocationParameters = {
  feature: AIFeature;
  entryId: string;
};

const Dialog = () => {
  const { feature, entryId, isLoading } = useDialogParameters();

  if (isLoading) {
    return <Spinner size="large" />;
  }

  switch (feature) {
    case AIFeature.TRANSLATE:
      return <CommonGenerator feature={featureConfig[feature]} entryId={entryId} isTranslate />;

    default:
      return <CommonGenerator feature={featureConfig[feature]} entryId={entryId} />;
  }
};

export default Dialog;
export type { DialogInvocationParameters };
