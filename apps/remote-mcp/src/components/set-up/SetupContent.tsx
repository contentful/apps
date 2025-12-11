import { type FC, useState } from 'react';
import { Stack, Tabs, Text, Button } from '@contentful/f36-components';
import { DownloadSimpleIcon } from '@contentful/f36-icons';

export const SetupContent: FC = () => {
  const [currentTab, setCurrentTab] = useState('cursor');

  return (
    <Stack flexDirection="column" spacing="spacingM" alignItems="flex-start">
      <Tabs currentTab={currentTab} onTabChange={setCurrentTab}>
        <Tabs.List variant="horizontal-divider">
          <Tabs.Tab panelId="cursor">Cursor</Tabs.Tab>
          <Tabs.Tab panelId="claude-code">Claude code</Tabs.Tab>
          <Tabs.Tab panelId="vs-code">VS code</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {currentTab === 'cursor' && (
        <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
          <Text fontSize="fontSizeM" marginBottom="none">
            Select the <strong>Install in Cursor</strong> button below. Alternatively, navigate to{' '}
            <strong>tools and integrations</strong> within Cursor to add a new MCP server.
          </Text>

          <Button
            variant="secondary"
            startIcon={<DownloadSimpleIcon />}
            size="small"
            as="a"
            href="https://cursor.com/en/install-mcp?name=contentful-mcp&config=eyJ1cmwiOiJodHRwczovL2NvbnRlbnRmdWwtcmVtb3RlLW1jcC1wcm9kdWN0aW9uLmNvbnRlbnRmdWwtZ21iaC53b3JrZXJzLmRldi9tY3AifQo="
            target="_blank"
            rel="noopener noreferrer">
            Install in Cursor
          </Button>
        </Stack>
      )}

      {currentTab === 'claude-code' && (
        <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
          <Text fontSize="fontSizeM" marginBottom="none">
            Instructions for Claude code coming soon.
          </Text>
        </Stack>
      )}

      {currentTab === 'vs-code' && (
        <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
          <Text fontSize="fontSizeM" marginBottom="none">
            Instructions for VS code coming soon.
          </Text>
        </Stack>
      )}
    </Stack>
  );
};
