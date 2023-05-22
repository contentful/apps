import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ResourceField } from 'components/Field/ResourceField';
import mockValue from 'helpers/mockValue';
import ResourceFieldProvider from 'providers/ResourceFieldProvider';

const SingleResource = () => {
  const sdk = useSDK<FieldAppSDK>();

  const handleRemove = () => {
    sdk.field.setValue(undefined);
  };

  const handleAddContent = () => sdk.field.setValue(mockValue(sdk));

  return (
    <ResourceFieldProvider
      isMultiple={false}
      handleAddContent={handleAddContent}
      handleRemove={handleRemove}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default SingleResource;
