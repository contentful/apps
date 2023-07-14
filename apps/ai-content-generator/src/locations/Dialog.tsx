import useDialogParameters from '@hooks/dialog/useDialogParameters';
import { AIFeature } from '@configs/features/featureConfig';
import { Spinner } from '@contentful/f36-components';
import useAIFeature from '@hooks/dialog/useAIFeature';

type DialogInvocationParameters = {
  feature: AIFeature;
  entryId: string;
};

const Dialog = () => {
  const { feature, entryId, isLoading } = useDialogParameters();
  const FeatureComponent = useAIFeature(feature);

  if (!FeatureComponent || isLoading) {
    return <Spinner size="large" />;
  }

  return <FeatureComponent entryId={entryId} />;
};

export default Dialog;
export type { DialogInvocationParameters };
