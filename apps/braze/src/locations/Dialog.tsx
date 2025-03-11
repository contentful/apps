import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  generateConnectedContentCall,
  Field,
  assembleQuery,
  getGraphQLResponse,
} from '../helpers/assembleQuery';
import generateLiquidTags from '../helpers/generateLiquidTags';

import {
  Box,
  Button,
  Flex,
  List,
  ListItem,
  Paragraph,
  Subheading,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useEffect, useState } from 'react';
import tokens from '@contentful/f36-tokens';
import Splitter from '../components/Splitter';

export type InvocationParams = {
  entryId: string;
  entryFields: Field[];
  contentTypeId: string;
};

const STEPS = ['fields', 'locales', 'result'];

function nextStep(step: string): string {
  const currentStepIndex = STEPS.findIndex((s) => s === step);
  const nextStepIndex =
    currentStepIndex < STEPS.length - 1 ? currentStepIndex + 1 : currentStepIndex;
  return STEPS[nextStepIndex];
}

function previousStep(step: string): string {
  const currentStepIndex = STEPS.findIndex((s) => s === step);
  const nextStepIndex = currentStepIndex > 0 ? currentStepIndex - 1 : currentStepIndex;
  return STEPS[nextStepIndex];
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();
  const [graphqlResponse, setGraphqlResponse] = useState<string>();
  const [step, setStep] = useState('fields');

  const spaceId = sdk.ids.space;
  const token = sdk.parameters.installation.apiKey;
  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const contentTypeId = invocationParams.contentTypeId;
  const entryId = invocationParams.entryId;
  const query = assembleQuery(contentTypeId, entryId, invocationParams.entryFields);
  const connectedContentCall = generateConnectedContentCall(query, spaceId, token);
  const liquidTags = generateLiquidTags(contentTypeId, invocationParams.entryFields);
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await getGraphQLResponse(spaceId, token, query);
      setGraphqlResponse(JSON.stringify(response));
    };
    fetchEntry();
  }, []);

  let dialogBody;
  if (step === 'fields') {
    dialogBody = (
      <Paragraph fontColor="gray700" lineHeight="lineHeightCondensed">
        Select which fields you would like to include in your Connected Content call. Selecting
        fields from referenced entries is limited to 5 nested references. For more information on
        Braze Connected Content {''}
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href="https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content"
          target="_blank"
          rel="noopener noreferrer">
          view documentation here
        </TextLink>
      </Paragraph>
    );
  } else if (step === 'locales') {
    dialogBody = (
      <Paragraph fontColor="gray700" lineHeight="lineHeightCondensed">
        Select the locales you want to reference in Braze messages.
      </Paragraph>
    );
  } else {
    dialogBody = (
      <>
        <Paragraph fontColor="gray700" lineHeight="lineHeightCondensed">
          Your Braze Connected Content call can be pasted into the body of a Braze campaign, which
          will then give you access to the JSON payload shown below, which can be referenced via
          liquid tags, to insert specific content fields into your campaign.
        </Paragraph>
        <Box
          padding="spacingM"
          style={{
            border: `1px solid ${tokens.gray200}`,
          }}>
          <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
            Braze Connected Content Call
          </Subheading>
          <code>{connectedContentCall}</code>

          <Splitter marginTop="spacingL" marginBottom="spacingL" />

          <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
            Liquid tag to reference selected Contentful fields, within Braze message body
          </Subheading>
          <List>
            {liquidTags.map((liquidTag) => (
              <ListItem key={liquidTag}>
                <code>{liquidTag}</code>
              </ListItem>
            ))}
          </List>

          <Splitter marginTop="spacingL" marginBottom="spacingL" />

          <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
            JSON data available in Braze via Connected Content call
          </Subheading>
          <code>{graphqlResponse}</code>
        </Box>
      </>
    );
  }

  return (
    <Box
      paddingBottom="spacingM"
      paddingTop="spacingM"
      paddingLeft="spacingL"
      paddingRight="spacingL">
      {dialogBody}
      <Flex
        padding="spacingM"
        gap="spacingM"
        justifyContent="end"
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'white',
        }}>
        {step !== 'fields' && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setStep((currentStep) => previousStep(currentStep))}>
            Back
          </Button>
        )}
        {step !== 'result' && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setStep((currentStep) => nextStep(currentStep))}>
            Next
          </Button>
        )}
        {step === 'result' && (
          <Button variant="primary" size="small" onClick={() => sdk.close()}>
            Close
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default Dialog;
