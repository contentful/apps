import { FC } from 'react';
import { Box, Flex, Heading, Paragraph, Card } from '@contentful/f36-components';

const codeStyles = {
  root: {
    padding: '32px',
    height: '100%',
    overflowY: 'auto' as const,
  },
  codeBlock: {
    backgroundColor: '#F7F9FA',
    padding: '16px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#394654',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
};

export const CodeView: FC = () => {
  return (
    <Flex flexDirection="column" gap="spacingL" style={codeStyles.root}>
      <Flex flexDirection="column" gap="spacingS">
        <Heading as="h2" marginBottom="none">
          Generated Code
        </Heading>
        <Paragraph marginBottom="none" fontColor="gray600">
          This is where the AI-generated code for your configuration page will appear.
        </Paragraph>
      </Flex>

      <Card padding="large">
        <Flex flexDirection="column" gap="spacingM">
          <Heading as="h3" marginBottom="none">
            Code Preview
          </Heading>
          <Paragraph fontColor="gray600">
            As you interact with the AI agent, the generated code will be displayed here.
          </Paragraph>

          <Box style={codeStyles.codeBlock}>
            {`// Your generated configuration page code will appear here
// Example:
import { FC } from 'react';
import { Flex, Heading, Form } from '@contentful/f36-components';

export const ConfigurationPage: FC = () => {
  return (
    <Flex flexDirection="column" gap="spacingL">
      <Heading>Your App Configuration</Heading>
      {/* Your configuration form fields */}
    </Flex>
  );
};`}
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
};
