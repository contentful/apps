import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ResourceField } from '../ResourceField';
import mockValue from 'helpers/mockValue';
import ResourceFieldProvider from 'providers/ResourceFieldProvider';
import { ExternalResourceLink } from 'types';

const isMultiple = true;

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
    const resourceArray = sdk.field.getValue();

    const newValue = resourceArray.filter((obj: ExternalResourceLink, i: number) => i !== index);
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
      isMultiple={isMultiple}
      handleAddContent={handleAddContent}
      handleRemove={handleRemove}
      handleMoveToBottom={handleMoveToBottom}
      handleMoveToTop={handleMoveToTop}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default MultipleResources;
