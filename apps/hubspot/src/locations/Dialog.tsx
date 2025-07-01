import { Box, Button, Flex } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import FieldSelection from '../components/FieldSelection';
import { createClient } from 'contentful-management';
import { SdkField } from '../utils/fieldsProcessing';

export type InvocationParams = {
  entryTitle: string;
  fields: SdkField[];
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );
  useAutoResizer();
  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const fields = invocationParams.fields;
  const entryTitle = invocationParams.entryTitle;
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const callAction = async () => {
    const fieldsToSend = selectedFields.map((field) => {
      return fields.find((f) => f.uniqueId === field);
    });

    try {
      const response = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'createModulesAction',
        },
        {
          parameters: {
            entryTitle: entryTitle,
            fields: JSON.stringify(fieldsToSend),
          },
        }
      );
      const responseData = JSON.parse(response.response.body);
    } catch (error) {
      console.error('Error creating modules: ', error);
    }
  };

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
          onClick={callAction}
          isDisabled={selectedFields.length === 0}>
          Next
        </Button>
      </Flex>
    </Box>
  );
};

export default Dialog;
