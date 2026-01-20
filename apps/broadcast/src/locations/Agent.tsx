import {
  AIChatConversation,
  AIChatInput,
  AIChatMessage,
  AIChatMessageList,
  AIChatReasoning,
  AIChatSidePanel,
  AIChatHistory,
  MessageThread,
  MessageGroup,
  Slider,
} from '@contentful/f36-ai-components';
import { AgentAppSDK, ToolbarAction } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from '@ai-sdk/ui-utils';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { styles } from '../components/Agent.styles';
import { AIChatEmptyState } from '../components/AgentEmptyChat';

const Agent = () => {
  const sdk = useSDK<AgentAppSDK>();
  useAutoResizer();
  const [currentPanel, setCurrentPanel] = useState<'chat' | 'history'>('chat');
  const [layoutVariant, setLayoutVariant] = useState<'expanded' | 'normal'>('normal');
  const [isChangingLayout, setIsChangingLayout] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const pendingLayoutChangeRef = useRef<'expanded' | 'normal' | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const apiBase = 'https://d66179c76ce9.ngrok-free.app';
  const apiUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/api/agent/stream` : '/api/agent/stream';

  const { messages, append, status, stop } = useChat({
    api: apiUrl,
    body: {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    },
    streamProtocol: 'text',
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: 'You are Broadcast, an AI audio & video producer agent for Contentful.',
      },
    ],
  });

  const isStreaming = status === 'streaming';

  const getMessageText = useCallback((message: UIMessage) => {
    if (typeof message.content === 'string') {
      return message.content;
    }

    if ('parts' in message && Array.isArray(message.parts)) {
      return message.parts
        .map((part) =>
          typeof part === 'object' && part && 'text' in part && typeof part.text === 'string'
            ? part.text
            : ''
        )
        .join('');
    }

    return '';
  }, []);

  useEffect(() => {
    sdk.agent.onContextChange(() => {});
    sdk.agent.onToolbarAction((action: ToolbarAction) => {
      if (action.name === 'chat.history') {
        setCurrentPanel('history');
      } else if (action.name === 'chat.back') {
        setCurrentPanel('chat');
      } else if (action.name === 'chat.close') {
        // Handle close action if needed
      }
    });

    // Listen to layout variant changes from host UI
    const unsubscribeLayoutVariant = sdk.agent.onAgentLayoutVariantChange((variant) => {
      // If we have a pending change and it matches, clear the pending state
      if (pendingLayoutChangeRef.current === variant) {
        setLayoutVariant(variant);
        setIsChangingLayout(false);
        setLayoutError(null);
        pendingLayoutChangeRef.current = null;
      } else if (pendingLayoutChangeRef.current !== null) {
        // Host responded with different variant than requested - this is an error
        setLayoutError(`Expected ${pendingLayoutChangeRef.current} but received ${variant}`);
        setIsChangingLayout(false);
        pendingLayoutChangeRef.current = null;
      } else {
        // Host UI changed variant independently (not in response to our request)
        setLayoutVariant(variant);
        setIsChangingLayout(false);
        setLayoutError(null);
      }
    });

    return () => {
      unsubscribeLayoutVariant();
    };
  }, [sdk.agent]);

  const handleSubmit = useCallback(
    (editor: Editor) => {
      const content = editor.getText();
      if (!content.trim()) return;

      void append({ role: 'user', content: content.trim() });
      editor.commands.clearContent();
    },
    [append]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (!editorRef.current) return;

    editorRef.current.commands.setContent(suggestion);
    editorRef.current.commands.focus();
  }, []);

  const toggleLayoutVariant = useCallback(() => {
    // Don't allow multiple simultaneous changes
    if (isChangingLayout) {
      return;
    }

    const newVariant = layoutVariant === 'expanded' ? 'normal' : 'expanded';

    // Set pending state (but don't update actual state yet)
    pendingLayoutChangeRef.current = newVariant;
    setIsChangingLayout(true);
    setLayoutError(null);

    try {
      // Request the change from host UI - validation happens synchronously in SDK
      // Call-and-forget: errors will come back via onLayoutVariantChange callback
      sdk.agent.setAgentLayoutVariant(newVariant);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change layout';
      setLayoutError(errorMessage);
      setIsChangingLayout(false);
      pendingLayoutChangeRef.current = null;
    }
  }, [layoutVariant, sdk.agent, isChangingLayout]);

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => {
      if (message.role === 'system') return false;
      return getMessageText(message).trim().length > 0;
    });
  }, [messages, getMessageText]);

  const messageList = () => (
    <AIChatConversation>
      <AIChatMessageList className={styles.messageList}>
        {visibleMessages.length === 0 ? (
          <AIChatEmptyState
            onSuggestionClick={handleSuggestionClick}
            onToggleLayout={toggleLayoutVariant}
            currentLayoutVariant={layoutVariant}
            isChangingLayout={isChangingLayout}
            layoutError={layoutError}
          />
        ) : (
          <>
            {visibleMessages.map((message) => (
              <AIChatMessage
                key={message.id}
                authorRole={message.role === 'user' ? 'user' : 'assistant'}
                content={getMessageText(message)}
              />
            ))}
            {isStreaming && (
              <AIChatReasoning testId="ai-chat-reasoning">
                <div>Thinking about your entries...</div>
              </AIChatReasoning>
            )}
          </>
        )}
      </AIChatMessageList>
      <AIChatInput
        placeholder="Ask Broadcast to generate or analyze audio & video..."
        isStreaming={isStreaming}
        onSubmit={handleSubmit}
        onStop={stop}
        editorRef={editorRef as React.MutableRefObject<Editor>}
      />
    </AIChatConversation>
  );

  const historyPanel = () => {
    // Mock thread data matching MessageThread type
    const threads: MessageThread[] = [
      {
        id: '1',
        title: 'Translate marketing copy',
        lastActivity: new Date('2025-11-09T14:30:00'),
        onThreadClick: () => {
          setCurrentPanel('chat');
        },
        group: 'paused',
      },
      {
        id: '2',
        title: 'Help with Spanish grammar',
        lastActivity: new Date('2025-11-08T09:15:00'),
        onThreadClick: () => {
          console.log('Thread clicked: 2');
          setCurrentPanel('chat');
        },
        group: 'processing',
      },
      {
        id: '3',
        title: 'Generate blog post ideas',
        lastActivity: new Date('2025-11-07T16:45:00'),
        onThreadClick: () => {
          console.log('Thread clicked: 3');
          setCurrentPanel('chat');
        },
        group: 'done',
      },
      {
        id: '4',
        title: 'Summarize meeting notes',
        lastActivity: new Date('2025-11-06T11:20:00'),
        onThreadClick: () => {
          console.log('Thread clicked: 4');
          setCurrentPanel('chat');
        },
        group: 'done',
      },
    ];

    const groups: [MessageGroup, MessageGroup, MessageGroup] = [
      {
        id: 'paused',
        label: 'Paused',
        icon: null,
        filter: (thread: MessageThread) => thread.group === 'paused',
      },
      {
        id: 'processing',
        label: 'Processing',
        icon: null,
        filter: (thread: MessageThread) => thread.group === 'processing',
      },
      {
        id: 'done',
        label: 'Done',
        icon: null,
        filter: (thread: MessageThread) => thread.group === 'done',
      },
    ];

    return (
      <AIChatSidePanel>
        <AIChatHistory threads={threads} groups={groups} />
      </AIChatSidePanel>
    );
  };

  return (
    <Slider
      className={styles.slider}
      slideKey={currentPanel}
      duration={300}
      direction={currentPanel === 'chat' ? 'right' : 'left'}>
      {currentPanel === 'chat' ? messageList() : historyPanel()}
    </Slider>
  );
};

export default Agent;
