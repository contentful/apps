import React from 'react';
import { useChatRuntime, AssistantChatTransport } from '@assistant-ui/react-ai-sdk';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { Box, Flex } from '@contentful/f36-components';
import { ConfigPageHeader } from './config/ConfigPageHeader';
import { ChatSidebar } from './config/ChatSidebar';
import { MainContent } from './config/MainContent';
import { GenerateCodeTool } from './tools/generateCodeTool';
import { CodeGenerationToolUI } from './tools/CodeGenerationToolUI';

const ConfigPage = () => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: 'https://template-config-hack-api-rho.colorfuldemo.com/api/chat',
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Box
        style={{
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
        <ConfigPageHeader />

        <Flex>
          <ChatSidebar />
          <MainContent />
          <GenerateCodeTool />
          <CodeGenerationToolUI />
        </Flex>
      </Box>
    </AssistantRuntimeProvider>
  );
};

export default ConfigPage;
