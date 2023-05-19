import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import type { ExternalResourceLink } from 'types';

const useResourceValue = (isMultiple: boolean) => {
  const sdk = useSDK<FieldAppSDK>();

  const [value, setValue] = useState<ExternalResourceLink[]>([]);
  const [unlistenToField, setUnlistenToField] = useState<() => void>();

  const setSingleValue = (newValue: ExternalResourceLink) => {
    const valueArray = newValue ? [newValue] : [];
    setValue(valueArray);
  };

  const initializeValue = () => {
    const initialValue = sdk.field.getValue();

    if (!isMultiple) {
      setSingleValue(initialValue);
      return;
    }

    if (initialValue) {
      setValue(initialValue);
    }
  };

  const attachListener = () => {
    if (!unlistenToField) {
      setUnlistenToField(
        sdk.field.onValueChanged((value) => {
          if (!isMultiple) {
            setSingleValue(value);
            return;
          }

          setValue(value);
        })
      );
    }
  };

  const init = () => {
    initializeValue();
    attachListener();

    return () => {
      unlistenToField?.call(null);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(init, [isMultiple]);

  return {
    value,
  };
};

export default useResourceValue;
