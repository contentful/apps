import React, { useEffect } from 'react';
import { Flex, Icon, Text } from '@contentful/f36-components';
import { WarningOctagonIcon } from '@phosphor-icons/react';
import { ContentTypeField } from '../types';

interface ModalEditorValidatorProps {
  field: ContentTypeField;
  value: any;
  validations: string[];
  setValidations: (value: any) => void;
}

const requiredValidationPass = (field: ContentTypeField, value: any) => {
  if (!field.required) return true;

  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;

  return true;
};

export const FieldEditorValidator: React.FC<ModalEditorValidatorProps> = ({
  field,
  value,
  validations,
  setValidations,
}) => {
  useEffect(() => {
    if (requiredValidationPass(field, value)) {
      setValidations([]);
    } else {
      setValidations(['This field is required']);
    }
  }, [value]);

  return (
    <>
      {validations.length > 0 &&
        validations.map((validationString, index) => (
          <Flex key={`${validationString}-${index}`} alignItems="center" gap="spacingXs">
            <Icon as={WarningOctagonIcon} variant="negative" size="tiny"></Icon>
            <Text as="p" fontColor="red600">
              {validationString}
            </Text>
          </Flex>
        ))}
    </>
  );
};
