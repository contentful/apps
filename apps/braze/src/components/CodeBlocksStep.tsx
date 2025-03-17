import { useState, useEffect } from 'react';
import {
  assembleQuery,
  generateConnectedContentCall,
  getGraphQLResponse,
} from '../helpers/assembleQuery';
import { EntryInfo } from '../locations/Dialog';
import { Field } from '../fields/Field';
import WizardFooter from './WizardFooter';
import { Box, Button, Paragraph, Subheading } from '@contentful/f36-components';
import Splitter from './Splitter';
import tokens from '@contentful/f36-tokens';
import CodeBlock from './CodeBlock';

type CodeBlocksStepProps = {
  spaceId: string;
  contentfulToken: string;
  entryInfo: EntryInfo;
  fields: Field[];
  selectedLocales: string[];
  handlePreviousStep: () => void;
  handleClose: () => void;
};

function formatGraphqlResponse(response: JSON) {
  const jsonString = JSON.stringify(response, null, 2);
  return jsonString.replace(/\n/g, '\n');
}

const CodeBlocksStep = (props: CodeBlocksStepProps) => {
  const { spaceId, contentfulToken, entryInfo, fields, handlePreviousStep, handleClose } = props;
  const [graphqlResponse, setGraphqlResponse] = useState<string>('');

  const query = assembleQuery(entryInfo.contentTypeId, entryInfo.id, fields);
  const connectedContentCall = generateConnectedContentCall(query, spaceId, contentfulToken);
  const liquidTags = fields.flatMap((field) => field.generateLiquidTag());
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await getGraphQLResponse(spaceId, contentfulToken, query);
      const graphqlResponseWithNewlines = formatGraphqlResponse(response);

      setGraphqlResponse(graphqlResponseWithNewlines);
    };
    fetchEntry();
  }, [spaceId, contentfulToken, query]);

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
        <CodeBlock language={'liquid'} code={connectedContentCall} />

        <Splitter marginTop="spacingL" marginBottom="spacingL" />

        <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
          Liquid tag to reference selected Contentful fields, within Braze message body
        </Subheading>
        <CodeBlock language={'liquid'} code={liquidTags.join('\n')} />
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
