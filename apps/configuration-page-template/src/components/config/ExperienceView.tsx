import { FC } from 'react';
import { Flex, Heading, Paragraph, Card } from '@contentful/f36-components';

const experienceStyles = {
  root: {
    padding: '32px',
    height: '100%',
    overflowY: 'auto' as const,
  },
};

export const ExperienceView: FC = () => {
  return (
    <Flex flexDirection="column" gap="spacingL" style={experienceStyles.root}>
      <Flex flexDirection="column" gap="spacingS">
        <Heading as="h2" marginBottom="none">
          Experience Preview
        </Heading>
        <Paragraph marginBottom="none" fontColor="gray600">
          This is where users will see the visual preview of their configuration page.
        </Paragraph>
      </Flex>

      <Card padding="large">
        <Flex
          flexDirection="column"
          gap="spacingM"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: '400px' }}>
          <Heading as="h3" marginBottom="none">
            Preview Coming Soon
          </Heading>
          <Paragraph fontColor="gray600">
            The configuration page preview will appear here as you build it with the AI agent.
          </Paragraph>
        </Flex>
      </Card>
    </Flex>
  );
};
