import { useState, useEffect } from 'react';
import WizardFooter from './WizardFooter';
import { Box, Button, Paragraph, Subheading } from '@contentful/f36-components';
import Splitter from './Splitter';
import tokens from '@contentful/f36-tokens';
import CodeBlock from './CodeBlock';
import { Entry } from '../fields/Entry';

type CodeBlocksStepProps = {
  entry: Entry;
  selectedLocales: string[];
  handlePreviousStep: () => void;
  handleClose: () => void;
};

function formatGraphqlResponse(response: JSON) {
  const jsonString = JSON.stringify(response, null, 2);
  return jsonString.replace(/\n/g, '\n');
}

const CodeBlocksStep = (props: CodeBlocksStepProps) => {
  const { entry, handlePreviousStep, handleClose } = props;

  const [graphqlResponse, setGraphqlResponse] = useState<string>('');

  useEffect(() => {
    const fetchEntry = async () => {
      const response = await entry.getGraphQLResponse();
      const graphqlResponseWithNewlines = formatGraphqlResponse(response);

      setGraphqlResponse(graphqlResponseWithNewlines);
    };
    fetchEntry();
  }, [entry]);

  return (
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
        <CodeBlock language={'liquid'} code={entry.generateConnectedContentCall()} />

        <Splitter marginTop="spacingL" marginBottom="spacingL" />

        <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
          Liquid tag to reference selected Contentful fields, within Braze message body
        </Subheading>
        <CodeBlock language={'liquid'} code={entry.generateLiquidTags().join('\n')} />
        <Splitter marginTop="spacingL" marginBottom="spacingL" />

        <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
          JSON data available in Braze via Connected Content call
        </Subheading>
        <CodeBlock language={'json'} code={graphqlResponse} />
      </Box>

      <WizardFooter>
        <Button variant="secondary" size="small" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button variant="primary" size="small" onClick={handleClose}>
          Close
        </Button>
      </WizardFooter>
    </>
  );
};
export default CodeBlocksStep;
