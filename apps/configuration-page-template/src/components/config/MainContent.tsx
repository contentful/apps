import { FC } from 'react';
import { Box, Tabs } from '@contentful/f36-components';
import { ExperienceView } from './ExperienceView';
import { CodeView } from './CodeView';
import { useConfigStore } from '../../store/configStore';

const mainContentStyles = {
  root: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  tabsList: {
    borderBottom: '1px solid #E3E8EE',
    padding: '0 32px',
    height: '52px',
  },
  tabPanel: {
    flex: 1,
    overflow: 'auto' as const,
  },
};

export const MainContent: FC = () => {
  const selectedBlocks = useConfigStore((state) => state.selectedBlocks);
  const suggestedChange = useConfigStore((state) => state.suggestedChange);
  const acceptSuggestedChange = useConfigStore((state) => state.acceptSuggestedChange);
  const rejectSuggestedChange = useConfigStore((state) => state.rejectSuggestedChange);
  const getCurrentCode = useConfigStore((state) => state.getCurrentCode);
  return (
    <Box style={mainContentStyles.root}>
      <Tabs defaultTab="experience">
        <Tabs.List style={mainContentStyles.tabsList}>
          <Tabs.Tab panelId="experience">Experience</Tabs.Tab>
          <Tabs.Tab panelId="code">Code</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="experience" style={mainContentStyles.tabPanel}>
          <ExperienceView selectedBlocks={selectedBlocks} />
        </Tabs.Panel>

        <Tabs.Panel id="code" style={mainContentStyles.tabPanel}>
          <CodeView
            currentCode={getCurrentCode()}
            suggestedCode={suggestedChange?.suggestedCode || null}
            onAcceptChange={acceptSuggestedChange}
            onRejectChange={rejectSuggestedChange}
          />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};
