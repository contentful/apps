import React, { useEffect, useMemo, useState } from 'react';
import { Flex, Text, Icon } from '@contentful/f36-components';
import { ValidationExecutor } from '../../../validations';
import type { ContentTypeField } from '../types';
import { WarningOctagonIcon } from '@contentful/f36-icons';

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

  const validationExecutor = useMemo(() => {
    return new ValidationExecutor(field);
  }, [field]);

  useEffect(() => {
    const result = validationExecutor.validate(value);
    const errorMessages = result.errors.map((err) => err.message);
    setValidationErrors(errorMessages);

    const hasErrors = result.errors.length > 0;

    if (onValidationChange) {
      onValidationChange(hasErrors);
    }
  }, [value, validationExecutor, onValidationChange]);

  if (validationErrors.length === 0) {
    return null;
  }

  return (
    <>
      {validationErrors.map((error, index) => (
        <Flex key={index} alignItems="center" gap="spacingXs">
          <Icon as={WarningOctagonIcon} variant="negative" size="tiny"></Icon>
          <Text as="p" fontColor="red600">
            {error}
          </Text>
        </Flex>
      ))}
    </>
  );
};
