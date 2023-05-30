import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { SingleResource, MultipleResources, FieldFallback } from 'components/Field';
import withErrorBoundary from 'hooks/common/withErrorBoundary';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  if (sdk.parameters.instance.fieldType === 'multiple') {
    return <MultipleResources />;
  }

  return <SingleResource />;
};

export default withErrorBoundary(Field, FieldFallback);
