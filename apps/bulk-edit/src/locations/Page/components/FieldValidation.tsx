import React, { useEffect, useMemo, useState } from 'react';
import { FormControl } from '@contentful/f36-components';
import { useDebounce } from 'use-debounce';
import { ValidationExecutor } from '../../../validations';
import type { ContentTypeField } from '../types';

interface FieldValidationProps {
  field: ContentTypeField;
  value: any;
  onValidationChange?: (hasErrors: boolean) => void;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  field,
  value,
  onValidationChange,
}) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [debouncedValue] = useDebounce(value, 500);

  const validationExecutor = useMemo(() => {
    return new ValidationExecutor(field);
  }, [field]);

  useEffect(() => {
    const result = validationExecutor.validate(debouncedValue);
    const errorMessages = result.errors.map((err) => err.message);
    setValidationErrors(errorMessages);

    const hasErrors = !result.isValid;

    if (onValidationChange) {
      onValidationChange(hasErrors);
    }
  }, [debouncedValue, validationExecutor, onValidationChange]);

  if (validationErrors.length === 0) {
    return null;
  }

  return (
    <>
      {validationErrors.map((error, index) => (
        <FormControl.ValidationMessage key={index}>{error}</FormControl.ValidationMessage>
      ))}
    </>
  );
};
