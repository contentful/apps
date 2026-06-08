import { useState } from 'react';
import { Box, Flex, FormControl, Tabs, Text } from '@contentful/f36-components';
import { ScheduledContentTable } from './ScheduledContentTable';
import { RecentlyPublishedTable } from './RecentlyPublishedTable';
import { NeedsUpdateTable } from './NeedsUpdateTable';
import { styles } from './Dashboard.styles';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { ReactNode } from 'react';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';
import ContentTypeMultiSelect, { ContentType } from './ContentTypeMultiSelect';
import type { AppInstallationParameters } from '../locations/ConfigScreen';

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
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const { parameters } = sdk;
  const installation = (parameters?.installation ?? {}) as AppInstallationParameters;
  const recentlyPublishedDays = installation.recentlyPublishedDays;
  const needsUpdateMonths = installation.needsUpdateMonths;
  const [currentTab, setCurrentTab] = useState('scheduled');
  const [selectedNeedsUpdateContentTypes, setSelectedNeedsUpdateContentTypes] = useState<
    ContentType[]
  >([]);

  return (
    <Box marginTop="spacingXl">
      <Box padding="spacingL" style={styles.releasesTableContainer}>
        <Tabs currentTab={currentTab} onTabChange={setCurrentTab}>
          <Tabs.List variant="horizontal-divider">
            <Tabs.Tab panelId="scheduled">Scheduled content</Tabs.Tab>
            <Tabs.Tab panelId="recentlyPublished">Recently published</Tabs.Tab>
            <Tabs.Tab panelId="needsUpdate">Needs update</Tabs.Tab>
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
              <FormControl marginBottom="spacingM">
                <FormControl.Label>Filter by content type</FormControl.Label>
                <ContentTypeMultiSelect
                  selectedContentTypes={selectedNeedsUpdateContentTypes}
                  setSelectedContentTypes={setSelectedNeedsUpdateContentTypes}
                  sdk={sdk as unknown as ConfigAppSDK}
                  initialSelectedIds={installation.needsUpdateContentTypes}
                  disablePills={false}
                />
                <FormControl.HelpText>
                  Leave empty to use the configured default.
                </FormControl.HelpText>
              </FormControl>
              <NeedsUpdateTable
                entries={entries}
                contentTypes={contentTypes}
                selectedContentTypeIds={
                  selectedNeedsUpdateContentTypes.length > 0
                    ? selectedNeedsUpdateContentTypes.map((ct) => ct.id)
                    : undefined
                }
              />
            </TabPanelContent>
          </Tabs.Panel>
        </Tabs>
      </Box>
    </Box>
  );
};
