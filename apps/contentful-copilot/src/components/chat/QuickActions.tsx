import { Box, Button, Flex, Heading, Paragraph } from '@contentful/f36-components';
import { QUICK_ACTIONS } from '@configs/quickActions';

interface QuickActionsProps {
  onSelect: (message: string) => void;
}

const QuickActions = ({ onSelect }: QuickActionsProps) => (
  <Flex
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    style={{ flex: 1, padding: '40px 20px', textAlign: 'center' }}>
    <Box style={{ maxWidth: '480px', width: '100%' }}>
      <Heading as="h2" marginBottom="spacingS">
        Contentful Copilot
      </Heading>
      <Paragraph marginBottom="spacingXl">
        Ask me anything about your space, or get started with one of these:
      </Paragraph>
      <Flex flexWrap="wrap" gap="spacingS" justifyContent="center">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="secondary"
            size="small"
            onClick={() => onSelect(action.message)}>
            {action.label}
          </Button>
        ))}
      </Flex>
    </Box>
  </Flex>
);

export default QuickActions;
