import { useEffect, useRef, useState } from 'react';
import { AgentAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Note, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import ChatWindow from '@components/chat/ChatWindow';
import { useAgentLoop } from '@hooks/useAgentLoop';
import { AppInstallationParameters, ChatMessage } from '../types';

const Agent = () => {
  useAutoResizer();
  const sdk = useSDK<AgentAppSDK>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const params = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const hasCredentials = !!(params.apiKey || params.awsAccessKeyId || params.azureApiKey);

  useEffect(() => {
    if (!hasCredentials) {
      setConfigError('No credentials found. Go to App configuration to set up your AI provider.');
    }
  }, [hasCredentials]);

  // Subscribe to toolbar actions (close, back, history)
  useEffect(() => {
    const unsubscribe = sdk.agent.onToolbarAction((action) => {
      if (action.name === 'chat.back' || action.name === 'chat.close') {
        abortRef.current?.();
      }
    });
    return unsubscribe;
  }, [sdk.agent]);

  const { runAgentLoop } = useAgentLoop({
    params,
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
    defaultLocale: sdk.locales.default,
    cmaAdapter: sdk.cmaAdapter,
    onStreamingUpdate: (content) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          return [...prev.slice(0, -1), { ...last, content }];
        }
        return prev;
      });
    },
    onToolCall: (toolName) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          const existingTools = last.toolCalls ?? [];
          return [...prev.slice(0, -1), { ...last, toolCalls: [...existingTools, toolName] }];
        }
        return prev;
      });
    },
  });

  const handleSend = async (userText: string) => {
    if (!hasCredentials || isProcessing) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolCalls: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsProcessing(true);

    try {
      const history = [
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userText },
      ];

      const { abort, result } = runAgentLoop(history);
      abortRef.current = abort;

      const finalContent = await result;

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          return [...prev.slice(0, -1), { ...last, content: finalContent, isStreaming: false }];
        }
        return prev;
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: `Error: ${errorMessage}`, isStreaming: false },
          ];
        }
        return prev;
      });
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: tokens.colorWhite,
      }}>
      {configError && (
        <Note variant="warning" style={{ margin: tokens.spacingM, flexShrink: 0 }}>
          <Paragraph marginBottom="none">{configError}</Paragraph>
        </Note>
      )}
      <ChatWindow messages={messages} isProcessing={isProcessing} onSend={handleSend} />
    </Box>
  );
};

export default Agent;
