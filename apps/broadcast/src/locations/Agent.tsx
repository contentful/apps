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
// Tool call type for client-side execution
type AgentToolCall = {
  toolCallId: string;
  toolName: string;
  args: unknown;
};
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { styles } from '../components/Agent.styles';
import { AIChatEmptyState } from '../components/AgentEmptyChat';
import { useVideoGenerator } from '../hooks/useVideoGenerator';
import { uploadVideoAsset } from '../lib/contentful-upload';
import { delay } from '../lib/delay';
import {
  AGENT_API_BASE_URL,
  DEMO_AUDIO_ASSET_ID,
  DEMO_DELAY_MS,
  DEMO_VIDEO_ASSET_ID,
} from '../constants';

// Type for tool call arguments
type FindEntryArgs = { query: string };
type GenerateVideoArgs = { entryId: string };

const getLocalizedFieldValue = (field: unknown, locale: string) => {
  if (!field) return null;
  if (typeof field === 'object' && !Array.isArray(field)) {
    const localized = field as Record<string, unknown>;
    if (locale in localized) {
      return localized[locale];
    }
  }
  return field;
};

const getAssetIdFromField = (fieldValue: unknown): string | null => {
  if (!fieldValue) return null;
  if (Array.isArray(fieldValue)) {
    for (const item of fieldValue) {
      const id = getAssetIdFromField(item);
      if (id) return id;
    }
    return null;
  }
  if (typeof fieldValue === 'object' && fieldValue !== null && 'sys' in fieldValue) {
    const sys = (fieldValue as { sys?: { id?: string } }).sys;
    if (sys?.id) return sys.id;
  }
  return null;
};

const normalizeAssetUrl = (url: string) => (url.startsWith('//') ? `https:${url}` : url);

const createAssetLink = (assetId: string) => ({
  sys: {
    type: 'Link' as const,
    linkType: 'Asset' as const,
    id: assetId,
  },
});

const Agent = () => {
  const sdk = useSDK<AgentAppSDK>();
  useAutoResizer();
  const [currentPanel, setCurrentPanel] = useState<'chat' | 'history'>('chat');
  const [layoutVariant, setLayoutVariant] = useState<'expanded' | 'normal'>('normal');
  const [initialLayoutVariant, setInitialLayoutVariant] = useState<'expanded' | 'normal' | null>(
    null
  );
  const [isChangingLayout, setIsChangingLayout] = useState(false);
  const pendingLayoutChangeRef = useRef<'expanded' | 'normal' | null>(null);
  const autoExpandPendingRef = useRef(false);
  const autoExpandLastAttemptRef = useRef(0);
  const hasAutoCollapsedRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);

  // Client-side tool execution state
  const [isClientWorking, setIsClientWorking] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Video generator hook
  const { generateVideo } = useVideoGenerator();

  const installParams = sdk.parameters.installation as { demoMode?: boolean } | undefined;
  const isDemoMode = Boolean(installParams?.demoMode);

  const apiUrl = `${AGENT_API_BASE_URL.replace(/\/$/, '')}/api/agent/stream`;

  // Handle tool calls from the agent (client-side execution)
  const handleToolCall = useCallback(
    async (toolInvocation: AgentToolCall): Promise<string> => {
      const { toolName, args } = toolInvocation;

      if (toolName === 'find_entry') {
        setIsClientWorking(true);
        try {
          const { query } = args as FindEntryArgs;
          const entries = await sdk.cma.entry.getMany({
            query: { query, limit: 1 },
          });

          if (entries.items.length > 0) {
            const entry = entries.items[0];
            const titleField = entry.fields.title;
            const title =
              titleField && typeof titleField === 'object'
                ? (titleField[sdk.locales.default] as string) ?? 'Untitled'
                : 'Untitled';
            return `Found entry "${title}" with ID: ${entry.sys.id}. Please proceed with generating the video.`;
          }
          return `No entries found matching "${query}".`;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return `Error searching entries: ${message}`;
        } finally {
          setIsClientWorking(false);
        }
      }

      if (toolName === 'generate_video') {
        setIsClientWorking(true);
        setIsRendering(true);
        try {
          const { entryId } = args as GenerateVideoArgs;

          // Fetch the entry to get audio and image assets
          const entry = await sdk.cma.entry.get({ entryId });

          if (isDemoMode) {
            await delay(DEMO_DELAY_MS);

            const [audioAsset, videoAsset] = await Promise.all([
              sdk.cma.asset.get({ assetId: DEMO_AUDIO_ASSET_ID }),
              sdk.cma.asset.get({ assetId: DEMO_VIDEO_ASSET_ID }),
            ]);

            const audioUrl = audioAsset.fields.file?.[sdk.locales.default]?.url;
            const videoUrl = videoAsset.fields.file?.[sdk.locales.default]?.url;
            if (!audioUrl || !videoUrl) {
              return 'Demo assets are missing file URLs.';
            }
            if (videoUrl) {
              setGeneratedVideoUrl(normalizeAssetUrl(videoUrl));
            }

            let didUpdate = false;
            const updatedFields = { ...entry.fields };
            const locale = sdk.locales.default;

            if ('audioAsset' in entry.fields) {
              const existingField =
                typeof entry.fields.audioAsset === 'object' && entry.fields.audioAsset
                  ? (entry.fields.audioAsset as Record<string, unknown>)
                  : {};
              updatedFields.audioAsset = {
                ...existingField,
                [locale]: createAssetLink(DEMO_AUDIO_ASSET_ID),
              };
              didUpdate = true;
            }

            if ('videoAsset' in entry.fields) {
              const existingField =
                typeof entry.fields.videoAsset === 'object' && entry.fields.videoAsset
                  ? (entry.fields.videoAsset as Record<string, unknown>)
                  : {};
              updatedFields.videoAsset = {
                ...existingField,
                [locale]: createAssetLink(DEMO_VIDEO_ASSET_ID),
              };
              didUpdate = true;
            }

            if (didUpdate) {
              await sdk.cma.entry.update({ entryId }, { ...entry, fields: updatedFields });
            }

            return `Demo mode: attached audio/video assets. Video asset ID: ${DEMO_VIDEO_ASSET_ID}`;
          }

          // Extract audio and image asset links from entry fields
          const audioField = entry.fields.audioAsset ?? entry.fields.audio;
          const imageField = entry.fields.featuredImage ?? entry.fields.image;

          const localizedAudio = getLocalizedFieldValue(audioField, sdk.locales.default);
          const localizedImage = getLocalizedFieldValue(imageField, sdk.locales.default);

          const audioAssetId = getAssetIdFromField(localizedAudio);
          const imageAssetId = getAssetIdFromField(localizedImage);

          if (!audioAssetId || !imageAssetId) {
            return 'Entry is missing required audio or image assets. Expected audioAsset and featuredImage (or image).';
          }

          // Fetch the actual assets to get URLs
          const [audioAsset, imageAsset] = await Promise.all([
            sdk.cma.asset.get({ assetId: audioAssetId }),
            sdk.cma.asset.get({ assetId: imageAssetId }),
          ]);

          const audioUrl = audioAsset.fields.file?.[sdk.locales.default]?.url;
          const imageUrl = imageAsset.fields.file?.[sdk.locales.default]?.url;

          if (!audioUrl || !imageUrl) {
            return 'Could not retrieve audio or image URLs from assets.';
          }

          // Generate the video
          const videoBlob = await generateVideo({
            imageUrl: normalizeAssetUrl(imageUrl),
            audioUrl: normalizeAssetUrl(audioUrl),
          });

          // Upload the video to Contentful
          const assetId = await uploadVideoAsset(
            sdk as unknown as Parameters<typeof uploadVideoAsset>[0],
            videoBlob,
            {
              title: `Broadcast Video - ${entryId}`,
            }
          );

          // Get the uploaded asset URL for preview
          const uploadedAsset = await sdk.cma.asset.get({ assetId });
          const videoUrl = uploadedAsset.fields.file?.[sdk.locales.default]?.url;
          if (videoUrl) {
            setGeneratedVideoUrl(videoUrl.startsWith('//') ? `https:${videoUrl}` : videoUrl);
          }

          return `Video generated successfully! Asset ID: ${assetId}`;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return `Error generating video: ${message}`;
        } finally {
          setIsClientWorking(false);
          setIsRendering(false);
        }
      }

      return `Unknown tool: ${toolName}`;
    },
    [generateVideo, isDemoMode, sdk]
  );

  const { messages, append, status, stop } = useChat({
    api: apiUrl,
    body: {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    },
    maxSteps: 5, // Allow multiple tool calls in a conversation
    async onToolCall({ toolCall }) {
      // Execute tool on client side and return result
      const result = await handleToolCall(toolCall);
      return result;
    },
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: 'You are Broadcast, an AI audio & video producer agent for Contentful.',
      },
    ],
  });

  const isStreaming = status === 'streaming';

  const insertSentenceSpacing = (text: string) => text.replace(/([.!?])(?=[A-Z0-9])/g, '$1 ');

  const joinPartsWithSpacing = (parts: string[]) =>
    parts.reduce((result, part) => {
      if (!result) return part;
      if (!part) return result;
      const lastChar = result[result.length - 1];
      const nextChar = part[0];
      const needsSpace =
        /[A-Za-z0-9]$/.test(result) && /[A-Za-z0-9]/.test(nextChar) && lastChar !== '\n';
      return needsSpace ? `${result} ${part}` : `${result}${part}`;
    }, '');

  const getMessageText = useCallback((message: UIMessage) => {
    if (typeof message.content === 'string') {
      return insertSentenceSpacing(message.content);
    }

    if ('parts' in message && Array.isArray(message.parts)) {
      const joined = joinPartsWithSpacing(
        message.parts
          .map((part) =>
            typeof part === 'object' && part && 'text' in part && typeof part.text === 'string'
              ? part.text
              : ''
          )
          .filter(Boolean)
      );
      return insertSentenceSpacing(joined);
    }

    return '';
  }, []);

  const requestLayoutVariant = useCallback(
    (variant: 'expanded' | 'normal') => {
      if (pendingLayoutChangeRef.current === variant) {
        return;
      }

      if (isChangingLayout) {
        return;
      }

      pendingLayoutChangeRef.current = variant;
      setIsChangingLayout(true);

      try {
        sdk.agent.setAgentLayoutVariant(variant);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to change layout';
        console.error(errorMessage);
        setIsChangingLayout(false);
        pendingLayoutChangeRef.current = null;
      }
    },
    [isChangingLayout, sdk.agent]
  );

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
      if (initialLayoutVariant === null) {
        setInitialLayoutVariant(variant);
      }

      // If we have a pending change and it matches, clear the pending state
      if (pendingLayoutChangeRef.current === variant) {
        setLayoutVariant(variant);
        setIsChangingLayout(false);
        pendingLayoutChangeRef.current = null;
      } else if (pendingLayoutChangeRef.current !== null) {
        // Host responded with different variant than requested - this is an error
        setLayoutVariant(variant);
        setIsChangingLayout(false);
        pendingLayoutChangeRef.current = null;
      } else {
        // Host UI changed variant independently (not in response to our request)
        setLayoutVariant(variant);
        setIsChangingLayout(false);
      }
    });

    return () => {
      unsubscribeLayoutVariant();
    };
  }, [initialLayoutVariant, sdk.agent]);

  useEffect(() => {
    if (
      initialLayoutVariant === 'expanded' &&
      !hasAutoCollapsedRef.current &&
      !autoExpandPendingRef.current
    ) {
      hasAutoCollapsedRef.current = true;
      requestLayoutVariant('normal');
    }
  }, [initialLayoutVariant, requestLayoutVariant]);

  useEffect(() => {
    if (!autoExpandPendingRef.current) {
      return;
    }

    if (layoutVariant === 'expanded') {
      autoExpandPendingRef.current = false;
      return;
    }

    if (status === 'streaming' && !isChangingLayout) {
      const now = Date.now();
      if (now - autoExpandLastAttemptRef.current > 500) {
        autoExpandLastAttemptRef.current = now;
        requestLayoutVariant('expanded');
      }
      return;
    }
  }, [isChangingLayout, layoutVariant, requestLayoutVariant, status]);

  const handleSubmit = useCallback(
    (editor: Editor) => {
      const content = editor.getText();
      if (!content.trim()) return;

      autoExpandPendingRef.current = true;
      void append({ role: 'user', content: content.trim() });
      editor.commands.clearContent();
    },
    [append]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (!editorRef.current) return;

    autoExpandPendingRef.current = true;
    editorRef.current.commands.setContent(suggestion);
    editorRef.current.commands.focus();
  }, []);

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
          <AIChatEmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            {visibleMessages.map((message) => (
              <AIChatMessage
                key={message.id}
                authorRole={message.role === 'user' ? 'user' : 'assistant'}
                content={getMessageText(message)}
              />
            ))}
            {/* Show generated video player if available */}
            {generatedVideoUrl && (
              <div style={{ padding: '8px 16px' }}>
                <video
                  src={generatedVideoUrl}
                  controls
                  style={{ maxWidth: '100%', borderRadius: '8px' }}
                />
              </div>
            )}
            {/* Show streaming indicator */}
            {isStreaming && (
              <AIChatReasoning testId="ai-chat-reasoning">
                <div>Thinking about your entries...</div>
              </AIChatReasoning>
            )}
            {/* Show client-side tool execution indicator */}
            {(isClientWorking || isRendering) && !isStreaming && (
              <AIChatReasoning testId="ai-chat-client-working">
                <div>
                  {isRendering
                    ? 'Rendering video... This may take a moment.'
                    : 'Searching entries...'}
                </div>
              </AIChatReasoning>
            )}
          </>
        )}
      </AIChatMessageList>
      <AIChatInput
        placeholder="Ask this agent to generate or analyze audio & video..."
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
