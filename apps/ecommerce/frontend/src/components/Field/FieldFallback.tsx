import { Box, Button, Flex, Note } from '@contentful/f36-components';
import { Field as DefaultField } from '@contentful/default-field-editors';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ErrorComponentProps } from 'types';
import tokens from '@contentful/f36-tokens';

const FieldFallback = ({ error, resetErrorHandler }: ErrorComponentProps) => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  const resetField = async () => {
    sdk.dialogs
      .openConfirm({
        title: 'Reset JSON',
        message:
          "This will reset the field's JSON. All data on this field will be lost. Are you sure?",
        intent: 'negative',
        confirmLabel: 'Yes, reset it',
        cancelLabel: 'No',
      })
      .then(async (result) => {
        if (result) {
          await sdk.field.removeValue();
          resetErrorHandler();
        }
      });
  };

  return (
    <>
      <Note variant="negative" title="Error">
        {error.message}
      </Note>
      <Box style={{ marginTop: tokens.spacingM }}>
        {/* TODO: Absract field editor in multi resource editor into a component that can be used here */}
        <DefaultField sdk={sdk} />

        <Flex fullWidth justifyContent="space-between" style={{ marginTop: tokens.spacingM }}>
          <Button variant="primary" onClick={resetErrorHandler}>
            Retry
          </Button>

          <Button variant="negative" onClick={resetField}>
            Reset JSON
          </Button>
        </Flex>
      </Box>
    </>
  );
};

export default FieldFallback;
