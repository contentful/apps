import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import {
  Box,
  Button,
  Flex,
  Spinner,
  Textarea,
} from '@contentful/f36-components';
import { ArrowForwardIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import MessageBubble from './MessageBubble';
import QuickActions from './QuickActions';
import { ChatMessage } from '../../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSend: (message: string) => void;
}

const ChatWindow = ({ messages, isProcessing, onSend }: ChatWindowProps) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    setInput('');
    onSend(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (message: string) => {
    onSend(message);
  };

  const isEmpty = messages.length === 0;

  return (
    <Flex
      flexDirection="column"
      style={{
        height: '100%',
        minHeight: 0,
      }}>
      {/* Message area */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: tokens.spacingL,
          display: 'flex',
          flexDirection: 'column',
        }}>
        {isEmpty ? (
          <QuickActions onSelect={handleQuickAction} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isProcessing && messages[messages.length - 1]?.role !== 'assistant' && (
              <Flex alignItems="center" gap="spacingXs" style={{ marginBottom: tokens.spacingM }}>
                <Spinner size="small" />
              </Flex>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input area */}
      <Box
        style={{
          borderTop: `1px solid ${tokens.gray200}`,
          padding: tokens.spacingM,
          backgroundColor: tokens.colorWhite,
        }}>
        <Flex gap="spacingS" alignItems="flex-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your space… (Enter to send, Shift+Enter for new line)"
            rows={2}
            style={{ flex: 1, resize: 'none' }}
            isDisabled={isProcessing}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            isDisabled={!input.trim() || isProcessing}
            startIcon={<ArrowForwardIcon />}
            aria-label="Send message">
            Send
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChatWindow;
