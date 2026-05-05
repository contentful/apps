import { Box, Flex, Paragraph, Badge } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <Flex
      flexDirection="column"
      alignItems={isUser ? 'flex-end' : 'flex-start'}
      style={{ marginBottom: tokens.spacingM }}>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <Flex gap="spacingXs" flexWrap="wrap" style={{ marginBottom: tokens.spacingXs }}>
          {message.toolCalls.map((tool) => (
            <Badge key={tool} variant="secondary" size="small">
              {formatToolName(tool)}
            </Badge>
          ))}
        </Flex>
      )}
      <Box
        style={{
          maxWidth: '75%',
          padding: `${tokens.spacingS} ${tokens.spacingM}`,
          borderRadius: tokens.borderRadiusMedium,
          backgroundColor: isUser ? tokens.blue500 : tokens.gray100,
          color: isUser ? tokens.colorWhite : tokens.gray900,
        }}>
        <Paragraph
          marginBottom="none"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'inherit',
          }}>
          {message.content}
          {message.isStreaming && <span style={{ opacity: 0.6 }}>▌</span>}
        </Paragraph>
      </Box>
    </Flex>
  );
};

function formatToolName(tool: string): string {
  return tool.replace(/_/g, ' ');
}

export default MessageBubble;
