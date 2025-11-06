import { FC } from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';
import { ChatThread } from './ChatThread';
import { Thread } from '../assistant-ui/thread';

const sidebarStyles = {
  root: {
    width: '320px',
    borderRight: '1px solid #E3E8EE',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'white',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #E3E8EE',
    height: '52px',
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

      <Thread />
    </Box>
  );
};
