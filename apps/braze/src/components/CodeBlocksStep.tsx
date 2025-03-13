import {
  Box,
  CopyButton,
  Flex,
  List,
  ListItem,
  Paragraph,
  Subheading,
} from '@contentful/f36-components';
import Splitter from './Splitter';
import tokens from '@contentful/f36-tokens';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

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
        <Flex
          style={{
            backgroundColor: tokens.gray400,
            height: tokens.spacing2Xl,
            borderTopLeftRadius: tokens.borderRadiusMedium,
            borderTopRightRadius: tokens.borderRadiusMedium,
          }}
          justifyContent="end">
          <CopyButton value="x" size="small" />
        </Flex>
        <SyntaxHighlighter
          language="liquid"
          customStyle={{
            padding: '0px',
            margin: '0px',
            backgroundColor: tokens.gray100,
            border: `1px solid ${tokens.gray300}`,
            borderBottomLeftRadius: tokens.borderRadiusMedium,
            borderBottomRightRadius: tokens.borderRadiusMedium,
          }}
          lineNumberStyle={{
            paddingLeft: tokens.spacingS,
            paddingRight: tokens.spacingS,
            backgroundColor: 'white',
            borderRight: `1px solid ${tokens.gray300}`,
            width: '7%',
          }}
          showLineNumbers={true}>
          {connectedContentCall}
        </SyntaxHighlighter>

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
};
export default CodeBlocksStep;
