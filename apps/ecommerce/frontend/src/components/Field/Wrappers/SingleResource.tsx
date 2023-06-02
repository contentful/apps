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

  const handleAddResource = async (): Promise<any[]> => {
    const resources = await sdk.dialogs.openCurrentApp({
      allowHeightOverflow: true,
      position: 'center',
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: sdk.parameters.instance,
      width: 1400,
    });

    return Array.isArray(resources) ? resources : [];
  };

  const handleAddContent = () => {
    const newValue = mockValue(sdk);
    sdk.field.setValue(newValue);
  };

  return (
    <ResourceFieldProvider
      isMultiple={false}
      handleAddResource={handleAddResource}
      handleAddContent={handleAddContent}
      handleRemove={handleRemove}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default SingleResource;
