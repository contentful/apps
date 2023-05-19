import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ExternalResourceLink } from 'types';
import ResourceField from './ResourceField';
import mockValue from 'helpers/mockValue';

const SingleResource = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ExternalResourceLink>(sdk.field.getValue());
  const valueArray = value ? [value] : [];

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
    });
  }, [sdk.field, setValue]);

  const handleRemove = () => {
    sdk.field.setValue(undefined);
  };

  const addContent = () => sdk.field.setValue(mockValue(sdk));

  return (
    <ResourceField
      addContent={addContent}
      isMultiple={false}
      onRemove={handleRemove}
      total={valueArray.length}
      value={valueArray}
    />
  );
};

export default SingleResource;
