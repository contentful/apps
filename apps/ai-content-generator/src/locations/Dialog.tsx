import useDialogParameters from '@hooks/dialog/useDialogParameters';
import { AIFeature } from '@configs/features/featureConfig';
import { Spinner } from '@contentful/f36-components';

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
      return (
        <div>
          {feature} {entryId}
        </div>
      );

    default:
      return (
        <div>
          {feature} {entryId}
        </div>
      );
  }
};

export default Dialog;
export type { DialogInvocationParameters };
