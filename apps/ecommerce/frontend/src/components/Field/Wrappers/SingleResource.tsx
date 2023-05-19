import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ResourceField } from '../ResourceField';
import mockValue from 'helpers/mockValue';
import ResourceFieldProvider from 'providers/ResourceFieldProvider';

const isMultiple = false;

const SingleResource = () => {
  const sdk = useSDK<FieldAppSDK>();

  const handleRemove = () => {
    sdk.field.setValue(undefined);
  };

  const handleAddContent = () => sdk.field.setValue(mockValue(sdk));

  return (
    <ResourceFieldProvider
      isMultiple={isMultiple}
      onAddContent={handleAddContent}
      onRemove={handleRemove}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default SingleResource;
