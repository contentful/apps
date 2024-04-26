import { Box, FormControl, HelpText, ValidationMessage } from '@contentful/f36-components';
import React from 'react';

interface Props {
  isLoading: boolean;
  children: React.ReactNode;
  label?: string;
  isRequired?: boolean;
  helpText?: string | React.ReactNode;
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
  const helpTextComponent = helpTextCompontentFor(helpText);
  return (
    <Box>
      {label && <FormControl.Label isRequired={isRequired}>{label}</FormControl.Label>}
      {children}
      {helpTextComponent}
      {errorMessage && !isLoading && <ValidationMessage>{errorMessage}</ValidationMessage>}
    </Box>
  );
};

const helpTextCompontentFor = (helpText: Props['helpText']): React.ReactNode | undefined => {
  if (!helpText) return;
  if (typeof helpText === 'string') return <HelpText marginBottom="spacingXs">{helpText}</HelpText>;
  return helpText;
};
