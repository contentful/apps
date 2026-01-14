import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Box, Flex, Spinner } from '@contentful/f36-components';
import { EntryProps } from 'contentful-management';
import { ChartWrapper } from './ChartWrapper';
import {
  processOverallTrends,
  processContentTypeTrends,
  processCreatorTrends,
  type TimeRange,
} from '../utils/trendsDataProcessor';

import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK } from '@contentful/app-sdk';
import { useContentTypes } from '../hooks/useContentTypes';
import { MAX_CONTENT_TYPES_IN_LEGEND } from '../utils/consts';

const filterEntriesByContentTypeIds = (
  entries: EntryProps[],
  contentTypeIds: string[]
): EntryProps[] => {
  return entries.filter((entry) => {
    const contentTypeId = entry.sys.contentType.sys.id;
    return contentTypeIds.includes(contentTypeId);
  });
};

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
  const [selectedTab, setSelectedTab] = useState('overall');

  const [creatorsNames, setCreatorsNames] = useState<Map<string, string>>(new Map());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { contentTypeNames, isFetchingContentTypes } = useContentTypes(trackedContentTypes);

  const filteredEntries = useMemo(() => {
    const hasTrackedTypes = trackedContentTypes.length > 0;
    const exceedsLimit = contentTypeNames.size > MAX_CONTENT_TYPES_IN_LEGEND;

    if (!hasTrackedTypes && !exceedsLimit) {
      return entries;
    }

    let contentTypeIdsToFilter: string[];

    if (hasTrackedTypes) {
      contentTypeIdsToFilter = exceedsLimit
        ? trackedContentTypes.slice(0, MAX_CONTENT_TYPES_IN_LEGEND)
        : trackedContentTypes;
    } else {
      contentTypeIdsToFilter = Array.from(contentTypeNames.keys()).slice(
        0,
        MAX_CONTENT_TYPES_IN_LEGEND
      );
    }

    return filterEntriesByContentTypeIds(entries, contentTypeIdsToFilter);
  }, [entries, trackedContentTypes, contentTypeNames]);

  useEffect(() => {
    const fetchCreators = async () => {
      if (selectedTab !== 'byCreator') return;

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
  }, [selectedTab, sdk]);

  const overallData = useMemo(() => {
    return processOverallTrends(filteredEntries, { timeRange });
  }, [filteredEntries, timeRange]);

  const contentTypeData = useMemo(() => {
    return processContentTypeTrends(filteredEntries, { timeRange }, contentTypeNames);
  }, [filteredEntries, timeRange, contentTypeNames]);

  const creatorData = useMemo(() => {
    return processCreatorTrends(filteredEntries, { timeRange }, creatorsNames);
  }, [filteredEntries, timeRange, creatorsNames]);

  const handleTabChange = (id: string) => {
    setSelectedTab(id);
  };

  return (
    <Box data-testid="content-trends-tabs">
      <Tabs defaultTab={selectedTab} onTabChange={handleTabChange}>
        <Tabs.List variant="horizontal-divider">
          <Tabs.Tab panelId="overall">New Entries</Tabs.Tab>
          <Tabs.Tab panelId="byContentType">By Content Type</Tabs.Tab>
          <Tabs.Tab panelId="byCreator">By Creator</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="overall">
          <Box marginTop="spacingM">
            <ChartWrapper
              data={overallData}
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
