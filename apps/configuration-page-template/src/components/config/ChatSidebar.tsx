import { FC } from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';
import { ChatThread } from './ChatThread';

const sidebarStyles = {
  root: {
    width: '320px',
    height: '100%',
    borderRight: '1px solid #E3E8EE',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'white',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #E3E8EE',
  },
  icon: {
    fontSize: '16px',
    marginRight: '8px',
  },
};

export const ChatSidebar: FC = () => {
  return (
    <Box style={sidebarStyles.root}>
      <Flex alignItems="center" style={sidebarStyles.header}>
        <Box as="span" style={sidebarStyles.icon}>
          🤖
        </Box>
        <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
          App config agent
        </Text>
      </Flex>

      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <ChatThread />
      </Box>
    </Box>
  );
};
