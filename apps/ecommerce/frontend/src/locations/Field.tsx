import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import ResourceCard from '../components/ResourceCard';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  return sdk.parameters.instance.fieldType === 'multiple' ? <h1>multiple</h1> : <ResourceCard />;
};

export default Field;
