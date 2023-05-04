import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import MultipleResources from '../components/MultipleResources';
import SingleResource from '../components/SingleResource';
import FieldFallback from '../components/FieldFallback';
import withErrorBoundary from '../hooks/withErrorBoundary';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  if (sdk.parameters.instance.fieldType === 'multiple') {
    return <MultipleResources />;
  }

  return <SingleResource />;
};

export default withErrorBoundary(Field, FieldFallback);
