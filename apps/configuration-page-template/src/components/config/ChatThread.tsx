import { FC } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { Box, Flex, Heading, Text, Button, Stack } from '@contentful/f36-components';
import { AssistantMessage, UserMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';

const threadStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: 'white',
  },
  viewport: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '16px',
  },
  welcome: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    justifyContent: 'center',
  },
};

export const ChatThread: FC = () => {
  return (
    <ThreadPrimitive.Root style={threadStyles.root}>
      <ThreadPrimitive.Viewport style={threadStyles.viewport}>
        <ThreadPrimitive.If empty>
          <ThreadWelcome />
        </ThreadPrimitive.If>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <Box style={{ minHeight: '32px', flexGrow: 1 }} />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <ChatComposer />
    </ThreadPrimitive.Root>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      style={threadStyles.welcome}>
      <Stack flexDirection="column" spacing="spacingL" alignItems="center">
        <Heading as="h2" marginBottom="none">
          Let's build your app's configuration page
        </Heading>
        <Text fontSize="fontSizeL" fontColor="gray600">
          Choose an option below or describe what you'd like to build
        </Text>
      </Stack>

      <ThreadSuggestions />
    </Flex>
  );
};

const ThreadSuggestions: FC = () => {
  const suggestions = [
    {
      title: 'Add UI building blocks',
      description: 'Get started with pre-built components',
      prompt: 'Help me add UI building blocks to my configuration page',
    },
    {
      title: 'Tell me about your app',
      description: 'Describe your app configuration needs',
      prompt: 'I want to tell you about my app so you can help me build the configuration page',
    },
  ];

  return (
    <Stack
      flexDirection="column"
      spacing="spacingS"
      marginTop="spacing2Xl"
      style={{ width: '100%', maxWidth: '400px' }}>
      {suggestions.map((suggestion, index) => (
        <ThreadPrimitive.Suggestion
          key={`suggestion-${index}`}
          prompt={suggestion.prompt}
          send
          asChild>
          <Button
            variant="secondary"
            style={suggestionStyles.button}
            aria-label={suggestion.prompt}>
            <span style={suggestionStyles.buttonSpan}>
              <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
                {suggestion.title}
              </Text>
              <Text fontColor="gray600" fontSize="fontSizeS">
                {suggestion.description}
              </Text>
            </span>
          </Button>
        </ThreadPrimitive.Suggestion>
      ))}
    </Stack>
  );
};

const suggestionStyles = {
  button: {
    textAlign: 'left' as const,
    whiteSpace: 'normal' as const,
    height: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  buttonSpan: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    width: '100%',
  },
};
