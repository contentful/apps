import { Box, FormControl, HelpText, ValidationMessage } from '@contentful/f36-components';
import React from 'react';

interface Props {
  isLoading: boolean;
  children: React.ReactNode;
  label?: string;
  isRequired?: boolean;
  helpText?: string;
  errorMessage?: string;
}

export const SelectionWrapper = ({
  label,
  isLoading,
  isRequired,
  helpText,
  errorMessage,
  children,
}: Props) => {
  return (
    <Box>
      {label && <FormControl.Label isRequired={isRequired}>{label}</FormControl.Label>}
      {children}
      {helpText && <HelpText marginBottom="spacingXs">{helpText}</HelpText>}
      {errorMessage && !isLoading && <ValidationMessage>{errorMessage}</ValidationMessage>}
    </Box>
  );
};
