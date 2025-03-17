import { Box, Paragraph, Subheading } from '@contentful/f36-components';
import Splitter from './Splitter';
import tokens from '@contentful/f36-tokens';
import CodeBlock from './CodeBlock';

interface CodeBlocksStepProps {
  connectedContentCall: string;
  liquidTags: string[];
  graphqlResponse: string;
}
const CodeBlocksStep = (props: CodeBlocksStepProps) => {
  const { connectedContentCall, liquidTags, graphqlResponse } = props;
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
    </>
  );
};
export default CodeBlocksStep;
