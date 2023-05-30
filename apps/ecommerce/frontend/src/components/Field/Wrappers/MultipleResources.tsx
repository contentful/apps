import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ResourceField } from 'components/Field/ResourceField';
import mockValue from 'helpers/mockValue';
import ResourceFieldProvider from 'providers/ResourceFieldProvider';
import type { ExternalResourceLink } from 'types';

const MultipleResources = () => {
  const sdk = useSDK<FieldAppSDK>();

  const handleAddContent = () => {
    // TODO: Update this function to add a new resource(s) to the list
    const newValue = mockValue(sdk);
    const resourceArray = sdk.field.getValue();

    if (resourceArray) {
      sdk.field.setValue([...resourceArray, newValue]);
    } else {
      sdk.field.setValue([newValue]);
    }
  };

  const handleRemove = (index: number) => {
    const resourceArray = [...sdk.field.getValue()];
    resourceArray.splice(index, 1);

    const newValue = resourceArray.length > 0 ? resourceArray : undefined;
    sdk.field.setValue(newValue);
  };

  const handleMoveToTop = (index: number) => {
    const resourceArray = sdk.field.getValue();

    const newValue = [...resourceArray];
    newValue.unshift(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  const handleMoveToBottom = (index: number) => {
    const resourceArray = sdk.field.getValue();

    const newValue = [...resourceArray];
    newValue.push(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  return (
    <ResourceFieldProvider
      isMultiple={true}
      handleAddContent={handleAddContent}
      handleRemove={handleRemove}
      handleMoveToBottom={handleMoveToBottom}
      handleMoveToTop={handleMoveToTop}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default MultipleResources;
