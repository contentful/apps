import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ExternalResourceLink } from 'types';
import ResourceField from './ResourceField';
import mockValue from 'helpers/mockValue';

const MultipleResources = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ExternalResourceLink[]>(sdk.field.getValue());
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
      setTotal(value?.length);
    });
  }, [sdk.field, setValue]);

  const addContent = () => {
    // TODO: Update this function to add a new resource(s) to the list
    const newValue = mockValue(sdk);

    if (value) {
      sdk.field.setValue([...value, newValue]);
    } else {
      sdk.field.setValue([newValue]);
    }
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((obj, i) => i !== index);
    sdk.field.setValue(newValue);
  };

  const handleMoveToTop = (index: number) => {
    const newValue = [...value];
    newValue.unshift(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  const handleMoveToBottom = (index: number) => {
    const newValue = [...value];
    newValue.push(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  return (
    <ResourceField
      addContent={addContent}
      isMultiple={true}
      onMoveToBottom={handleMoveToBottom}
      onMoveToTop={handleMoveToTop}
      onRemove={handleRemove}
      total={total}
      value={value}
    />
  );
};

export default MultipleResources;
