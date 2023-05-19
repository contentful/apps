import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import MultipleResources from 'components/Field/MultipleResources';
import SingleResource from 'components/Field/SingleResource';
import FieldFallback from 'components/Field/FieldFallback';
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
