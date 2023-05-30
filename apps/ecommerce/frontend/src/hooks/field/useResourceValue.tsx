import { useFieldValue } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import type { ExternalResourceLink } from 'types';

const useResourceValue = (isMultiple: boolean) => {
  const [_value] = useFieldValue<ExternalResourceLink | ExternalResourceLink[]>();
  const [value, setValue] = useState<ExternalResourceLink[]>([]);

  const setSingleValue = (newValue: ExternalResourceLink) => {
    const valueArray = newValue ? [newValue] : [];
    setValue(valueArray);
  };

  const handleFieldChange = () => {
    if (!isMultiple) {
      setSingleValue(_value as ExternalResourceLink);
      return;
    }

    setValue((_value as ExternalResourceLink[]) || []);
  };

  useEffect(handleFieldChange, [_value, isMultiple]);

  return {
    value,
  };
};

export default useResourceValue;
