import { Button, Note } from '@contentful/f36-components';
import { Field as DefaultField } from '@contentful/default-field-editors';
import { useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ErrorComponentProps } from '../types';

const Fallback = ({ error, resetErrorHandler }: ErrorComponentProps) => {
  const sdk = useSDK<FieldAppSDK>();

  return (
    <>
      <Note variant="negative" title="Error">
        {error.message}
      </Note>
      <DefaultField sdk={sdk} />
      <Button variant="primary" onClick={resetErrorHandler}>
        Retry
      </Button>
    </>
  );
};

export default Fallback;
