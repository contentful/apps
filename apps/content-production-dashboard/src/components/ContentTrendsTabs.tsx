import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Box, Flex, Spinner } from '@contentful/f36-components';
import { EntryProps } from 'contentful-management';
import { ChartWrapper } from './ChartWrapper';
import {
  generateNewEntriesChartData,
  generateContentTypeChartData,
  generateCreatorChartData,
} from '../utils/trendsDataProcessor';
import type { TimeRange } from '../utils/types';

import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK } from '@contentful/app-sdk';
import { useContentTypes } from '../hooks/useContentTypes';

export interface ContentTrendsTabsProps {
  entries: EntryProps[];
  timeRange: TimeRange;
  trackedContentTypes: string[];
}

export const ContentTrendsTabs: React.FC<ContentTrendsTabsProps> = ({
  entries,
  trackedContentTypes,
  timeRange,
}) => {
  const sdk = useSDK<HomeAppSDK>();
  const [selectedTab, setSelectedTab] = useState('newEntries');

  const [creatorsNames, setCreatorsNames] = useState<Map<string, string>>(new Map());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { contentTypes, isFetchingContentTypes } = useContentTypes(trackedContentTypes);

  useEffect(() => {
    const fetchCreators = async () => {
      setIsLoadingUsers(true);
      try {
        const usersResponse = await sdk.cma.user.getManyForSpace({
          spaceId: sdk.ids.space,
        });

        const newCreatorsNames = new Map<string, string>();
        usersResponse.items.forEach((user) => {
          const fullName =
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email || user.sys.id;
          newCreatorsNames.set(user.sys.id, fullName);
        });

        setCreatorsNames(newCreatorsNames);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchCreators();
  }, [sdk]);

  const newEntries = useMemo(() => {
    return generateNewEntriesChartData(entries, { timeRange }, contentTypes);
  }, [entries, timeRange, contentTypes]);

  const contentTypeData = useMemo(() => {
    return generateContentTypeChartData(entries, { timeRange }, contentTypes);
  }, [entries, timeRange, contentTypes]);

  const creatorData = useMemo(() => {
    return generateCreatorChartData(entries, { timeRange }, creatorsNames, contentTypes);
  }, [entries, timeRange, creatorsNames, contentTypes]);

  const handleTabChange = (id: string) => {
    setSelectedTab(id);
  };

  return (
    <Box data-testid="content-trends-tabs">
      <Tabs defaultTab={selectedTab} onTabChange={handleTabChange}>
        <Tabs.List variant="horizontal-divider">
          <Tabs.Tab panelId="newEntries">New Entries</Tabs.Tab>
          <Tabs.Tab panelId="byContentType">By Content Type</Tabs.Tab>
          <Tabs.Tab panelId="byCreator">By Creator</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="newEntries">
          <Box marginTop="spacingM">
            <ChartWrapper
              data={newEntries}
              xAxisDataKey="date"
              linesLegends={['New Content']}
              legendTitle="Content:"
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="byContentType">
          <Box marginTop="spacingM">
            {isFetchingContentTypes ? (
              <Flex padding="spacingL" justifyContent="center">
                <Spinner size="medium" />
              </Flex>
            ) : contentTypeData.contentTypes.length === 0 ? (
              <Box padding="spacingL">
                No content type data available for the selected time range.
              </Box>
            ) : (
              <ChartWrapper
                data={contentTypeData.data}
                xAxisDataKey="date"
                linesLegends={contentTypeData.contentTypes}
                legendTitle="Content Types:"
              />
            )}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="byCreator">
          <Box marginTop="spacingM">
            {isLoadingUsers ? (
              <Flex padding="spacingL" justifyContent="center">
                <Spinner size="medium" />
              </Flex>
            ) : creatorData.creators.length === 0 ? (
              <Box padding="spacingL">No creator data available for the selected time range.</Box>
            ) : (
              <ChartWrapper
                data={creatorData.data}
                xAxisDataKey="date"
                linesLegends={creatorData.creators}
                legendTitle="Creators:"
              />
            )}
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};
