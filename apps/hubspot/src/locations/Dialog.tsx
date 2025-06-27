import { Box, Button, Flex } from '@contentful/f36-components';
import { DialogAppSDK, FieldType } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import FieldSelection from '../components/FieldSelection';

export type SdkField = {
  type: FieldType;
  id: string;
  uniqueId: string;
  name: string;
  locale?: string;
  linkType?: string; // FieldLinkType
  items?: {
    type: string;
    linkType: string;
  }; // Items
  supported: boolean;
};

export type InvocationParams = {
  fields: SdkField[];
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();
  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const fields = invocationParams.fields;
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  return (
    <Box margin="spacingL" marginTop="spacingM">
      <FieldSelection
        fields={fields}
        selectedFields={selectedFields}
        setSelectedFields={setSelectedFields}
      />

      <Flex
        paddingTop="spacingM"
        paddingBottom="spacingM"
        gap="spacingM"
        justifyContent="end"
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'white',
        }}>
        <Button
          variant="primary"
          size="small"
          onClick={() => {}} // TODO: add next step
          isDisabled={selectedFields.length === 0}>
          Next
        </Button>
      </Flex>
    </Box>
  );
};

export default Dialog;
