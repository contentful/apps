import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import MultipleResources from '../components/MultipleResources';
import SingleResource from '../components/SingleResource';
import ErrorBoundary from '../components/ErrorBoundary';
import Fallback from '../components/Fallback';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  const output =
    sdk.parameters.instance.fieldType === 'multiple' ? <MultipleResources /> : <SingleResource />;

  return <ErrorBoundary FallbackComponent={Fallback}>{output}</ErrorBoundary>;
};

export default Field;
