import { useEffect, useState } from 'react';
import WizardFooter from '../WizardFooter';
import { Box, Button, Paragraph, Skeleton, Subheading } from '@contentful/f36-components';
import { Splitter } from 'shared-components';
import tokens from '@contentful/f36-tokens';
import CodeBlock from '../CodeBlock';
import { Entry } from '../../fields/Entry';
import OctagonValidationMessage from '../OctagonValidationMessage';

type CodeBlocksStepProps = {
  entry: Entry;
  selectedLocales: string[];
  handlePreviousStep: () => void;
  handleClose: () => void;
};

function formatGraphqlResponse(response: string) {
  return response.replace(/\n/g, '\n');
}

function hasError(response: string) {
  return !!JSON.parse(response).errors?.length;
}

const CodeBlocksStep = (props: CodeBlocksStepProps) => {
  const { entry, handlePreviousStep, handleClose, selectedLocales } = props;
  const [graphqlResponse, setgraphqlResponse] = useState<string | undefined>(undefined);
  const liquidTagsCode = entry.generateLiquidTags(selectedLocales).join('\n');
  const contentCallCode = entry.generateConnectedContentCall(selectedLocales);

  useEffect(() => {
    const fetchEntry = async () => {
      const response = await entry.getGraphQLResponse(selectedLocales);

      const jsonString = JSON.stringify(response, null, 2);
      setgraphqlResponse(jsonString);
    };
    fetchEntry();
  }, []);

  if (!graphqlResponse) {
    return (
      <Skeleton.Container width="97%">
        <Skeleton.BodyText offsetLeft="50" offsetTop="20" numberOfLines={4} />
      </Skeleton.Container>
    );
  }

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
        <CodeBlock language={'liquid'} code={contentCallCode} showCopyButton />

        <Splitter marginTop="spacingL" marginBottom="spacingL" />

        <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
          Liquid tag to reference selected Contentful fields, within Braze message body
        </Subheading>
        <CodeBlock language={'liquid'} code={liquidTagsCode} showCopyButton />
        <Splitter marginTop="spacingL" marginBottom="spacingL" />

        <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeL" lineHeight="lineHeightL">
          JSON data available in Braze via Connected Content call
        </Subheading>
        <CodeBlock
          language={'json'}
          code={formatGraphqlResponse(graphqlResponse)}
          hasError={hasError(graphqlResponse)}
        />
        {hasError(graphqlResponse) && (
          <OctagonValidationMessage>
            The Connected Content request failed. Please review the error details above.
          </OctagonValidationMessage>
        )}
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
