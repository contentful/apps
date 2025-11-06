import { FC, useState } from 'react';
import { Box, Flex, Text, ButtonGroup, Button } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { Thread } from '../assistant-ui/thread';
import { UIBlocks } from './UIBlocks';
import { SparkleIcon } from '@contentful/f36-icons';
import { useConfigStore } from '../../store/configStore';

const sidebarStyles = {
  root: {
    width: '320px',
    borderRight: '1px solid #E3E8EE',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'white',
  },
  header: {
    borderBottom: '1px solid #E3E8EE',
    flexDirection: 'column' as const,
    height: '52px',
    padding: '9px 16px',
    width: '100%',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    fontSize: '16px',
    marginRight: '8px',
  },
};

type ViewMode = 'chat' | 'ui-blocks';

export const ChatSidebar: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const selectedBlocks = useConfigStore((state) => state.selectedBlocks);
  const setSelectedBlocks = useConfigStore((state) => state.setSelectedBlocks);
  const setPendingChange = useConfigStore((state) => state.setPendingChange);

  const handleSuggestionClick = () => {
    setViewMode('ui-blocks');
  };

  return (
    <Box style={sidebarStyles.root}>
      <Box style={sidebarStyles.header}>
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" style={sidebarStyles.headerTop}>
            <Box as="span" style={sidebarStyles.icon}>
              <SparkleIcon />
            </Box>
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
              App config agent
            </Text>
          </Flex>

          <ButtonGroup>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setViewMode('chat')}
              style={{
                fontSize: tokens.fontSizeS,
                padding: '4px 8px',
                backgroundColor: viewMode === 'chat' ? tokens.gray200 : 'transparent',
              }}>
              Chat
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setViewMode('ui-blocks')}
              style={{
                fontSize: tokens.fontSizeS,
                padding: '4px 8px',
                backgroundColor: viewMode === 'ui-blocks' ? tokens.gray200 : 'transparent',
              }}>
              UI blocks
            </Button>
          </ButtonGroup>
        </Flex>
      </Box>

      {viewMode === 'chat' && (
        <Thread
          onSuggestionClick={handleSuggestionClick}
          selectedBlocks={selectedBlocks}
          onPendingChange={setPendingChange}
        />
      )}
      {viewMode === 'ui-blocks' && (
        <UIBlocks selectedBlocks={selectedBlocks} onSelectionChange={setSelectedBlocks} />
      )}
    </Box>
  );
};
