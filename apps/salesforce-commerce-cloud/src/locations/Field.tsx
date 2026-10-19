import React, { useState, useEffect } from 'react';

import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';

import SelectItemAction from '../components/field/SelectItemAction';
import SingleItem from '../components/field/SingleItem';
import MultipleItems from '../components/field/MultipleItems';
import ReferenceHealthNote from '../components/field/ReferenceHealthNote';
import { FieldType, ScopeOptions } from '../utils/resources';

import { KeyValueMap } from 'contentful-management';

export interface AppInstanceParameters extends KeyValueMap {
  fieldType: FieldType;
  // Optional per-field overrides of the installation's site / catalog scope.
  siteId?: string;
  catalogId?: string;
  includeVariants?: boolean;
}

export const scopeOptionsFrom = (instance: AppInstanceParameters): ScopeOptions => ({
  siteId: instance.siteId || undefined,
  catalogId: instance.catalogId || undefined,
  includeVariants: instance.includeVariants || undefined,
});

const Field = () => {
  useAutoResizer();
  const sdk = useSDK<FieldAppSDK>();

  const selectMultiple = sdk.field.type === 'Array';
  const [value, setValue] = useState<string | string[]>(sdk.field.getValue());

  useEffect(() => {
    const valueChangeHandler = async (value: string | string[]) => {
      setValue(value);
    };

    return sdk.field.onValueChanged(valueChangeHandler);
  }, [sdk.field]);

  return (
    <>
      {value?.length ? (
        <>
          <ReferenceHealthNote value={value} />
          {selectMultiple ? (
            <MultipleItems value={value as string[]} />
          ) : (
            <SingleItem value={value as string} />
          )}
        </>
      ) : null}
      {(!value?.length || selectMultiple) && <SelectItemAction fieldValue={value} />}
    </>
  );
};

export default Field;
