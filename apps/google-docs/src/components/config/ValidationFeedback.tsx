import { FormControl, Flex, Text, Spinner } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

interface ValidationFeedbackProps {
  isValidating: boolean;
  isValid: boolean;
  validationError: string;
  apiUnavailable: boolean;
}

export const ValidationFeedback = ({
  isValidating,
  isValid,
  validationError,
  apiUnavailable,
}: ValidationFeedbackProps) => {
  if (isValidating) {
    return (
      <Flex marginTop="spacing2Xs">
        <Text marginRight="spacingXs">Validating API key</Text>
        <Spinner size="small" />
      </Flex>
    );
  }

  if (!isValid) {
    return (
      <FormControl.ValidationMessage>
        {validationError || 'Please enter a valid OpenAI API key'}
      </FormControl.ValidationMessage>
    );
  }

  if (apiUnavailable && validationError) {
    return (
      <FormControl.HelpText marginTop="spacing2Xs" style={{ color: tokens.orange600 }}>
        {validationError}
      </FormControl.HelpText>
    );
  }

  return null;
};
