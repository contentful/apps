import { Box, Button, Note } from '@contentful/f36-components';
import { Field as DefaultField } from '@contentful/default-field-editors';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ErrorComponentProps } from '../types';
import tokens from '@contentful/f36-tokens';

const FieldFallback = ({ error, resetErrorHandler }: ErrorComponentProps) => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  return (
    <>
      <Note variant="negative" title="Error">
        {error.message}
      </Note>
      <Box style={{ marginTop: tokens.spacingM }}>
        {/* TODO: Absract field editor in multi resource editor into a component that can be used here */}
        <DefaultField sdk={sdk} />
        <Button variant="primary" onClick={resetErrorHandler}>
          Retry
        </Button>
      </Box>
    </>
  );
};

export default FieldFallback;
