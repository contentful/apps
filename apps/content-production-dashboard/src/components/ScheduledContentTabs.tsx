import { useState } from 'react';
import { Box, Flex, Tabs, Text } from '@contentful/f36-components';
import { ScheduledContentTable } from './ScheduledContentTable';
import { RecentlyPublishedTable } from './RecentlyPublishedTable';
import { NeedsUpdateTable } from './NeedsUpdateTable';
import { styles } from './Dashboard.styles';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { ReactNode } from 'react';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';

interface TabPanelContentProps {
  description: string;
  children: ReactNode;
}

const TabPanelContent = ({ description, children }: TabPanelContentProps) => {
  return (
    <Flex flexDirection="column" marginLeft="spacingM" marginRight="spacingM" marginTop="spacingL">
      <Text fontSize="fontSizeM" fontColor="gray600" marginBottom="spacingM">
        {description}
      </Text>
      {children}
    </Flex>
  );
};

export const ScheduledContentTabs = ({
  scheduledActions,
  entries,
  contentTypes,
}: {
  scheduledActions: ScheduledActionProps[];
  entries: EntryProps[];
  contentTypes: Map<string, ContentTypeProps>;
}) => {
  const { parameters } = useSDK<HomeAppSDK | PageAppSDK>();
  const recentlyPublishedDays = parameters?.installation?.recentlyPublishedDays;
  const needsUpdateMonths = parameters?.installation?.needsUpdateMonths;
  const [currentTab, setCurrentTab] = useState('scheduled');

  return (
    <Box marginTop="spacingXl">
      <Box padding="spacingL" style={styles.releasesTableContainer}>
        <Tabs currentTab={currentTab} onTabChange={setCurrentTab}>
          <Tabs.List>
            <Tabs.Tab panelId="scheduled">Scheduled Content</Tabs.Tab>
            <Tabs.Tab panelId="recentlyPublished">Recently Published</Tabs.Tab>
            <Tabs.Tab panelId="needsUpdate">Needs Update</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="scheduled">
            <TabPanelContent description="Content scheduled will appear here.">
              <ScheduledContentTable
                scheduledActions={scheduledActions}
                entries={entries}
                contentTypes={contentTypes}
              />
            </TabPanelContent>
          </Tabs.Panel>
          <Tabs.Panel id="recentlyPublished">
            <TabPanelContent
              description={`Content published in the last ${recentlyPublishedDays} ${
                recentlyPublishedDays === 1 ? 'day' : 'days'
              } will appear here.`}>
              <RecentlyPublishedTable entries={entries} contentTypes={contentTypes} />
            </TabPanelContent>
          </Tabs.Panel>
          <Tabs.Panel id="needsUpdate">
            <TabPanelContent
              description={`Content older than ${needsUpdateMonths} ${
                needsUpdateMonths === 1 ? 'month' : 'months'
              } will appear here.`}>
              <NeedsUpdateTable entries={entries} contentTypes={contentTypes} />
            </TabPanelContent>
          </Tabs.Panel>
        </Tabs>
      </Box>
    </Box>
  );
};
