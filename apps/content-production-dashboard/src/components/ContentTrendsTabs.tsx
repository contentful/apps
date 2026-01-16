import React, { useEffect, useMemo, useState } from 'react';
import { Box, Flex, FormControl, Paragraph, Spinner, Tabs, Text } from '@contentful/f36-components';
import { EntryProps } from 'contentful-management';
import { ChartWrapper } from './ChartWrapper';
import {
  generateNewEntriesChartData,
  generateContentTypeChartData,
  generateCreatorChartData,
} from '../utils/trendsDataProcessor';
import { TimeRange } from '../utils/types';

import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK, HomeAppSDK } from '@contentful/app-sdk';
import { useContentTypes } from '../hooks/useContentTypes';
import ContentTypeMultiSelect, { ContentType } from './ContentTypeMultiSelect';
import { styles } from './ContentTrendsTabs.styles';

export interface ContentTrendsTabsProps {
  entries: EntryProps[];
  timeRange: TimeRange;
  defaultContentTypes: string[];
}

export const ContentTrendsTabs: React.FC<ContentTrendsTabsProps> = ({
  entries,
  defaultContentTypes,
  timeRange,
}) => {
  const sdk = useSDK<HomeAppSDK>();
  const [selectedTab, setSelectedTab] = useState('newEntries');

  const [creatorsNames, setCreatorsNames] = useState<Map<string, string>>(new Map());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { contentTypes, isFetchingContentTypes } = useContentTypes();
  const [selectedChartContentTypes, setSelectedChartContentTypes] = useState<ContentType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

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

  useEffect(() => {
    if (contentTypes.size > 0 && !isInitialized) {
      let initialSelected: ContentType[] = Array.from(contentTypes.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 5);

      if (defaultContentTypes && defaultContentTypes.length > 0) {
        initialSelected = defaultContentTypes
          .map((id) => {
            const name = contentTypes.get(id);
            return name ? { id, name } : null;
          })
          .filter((ct): ct is ContentType => ct !== null);
      }

      if (initialSelected.length > 0) {
        setSelectedChartContentTypes(initialSelected);
        setIsInitialized(true);
      }
    }
  }, [contentTypes, defaultContentTypes, isInitialized]);

  const filteredContentTypesForChart = useMemo(() => {
    const filtered = new Map<string, string>();
    selectedChartContentTypes.forEach((ct) => {
      const name = contentTypes.get(ct.id);
      if (name) {
        filtered.set(ct.id, name);
      }
    });
    return filtered;
  }, [selectedChartContentTypes, contentTypes]);

  const newEntries = useMemo(() => {
    return generateNewEntriesChartData(entries, { timeRange }, filteredContentTypesForChart);
  }, [entries, timeRange, filteredContentTypesForChart]);

  const contentTypeData = useMemo(() => {
    return generateContentTypeChartData(entries, { timeRange }, filteredContentTypesForChart);
  }, [entries, timeRange, filteredContentTypesForChart]);

  const creatorData = useMemo(() => {
    return generateCreatorChartData(entries, { timeRange }, creatorsNames, filteredContentTypesForChart);
  }, [entries, timeRange, creatorsNames, filteredContentTypesForChart]);

  const handleContentTypeSelection = (newSelected: ContentType[]) => {
    if (newSelected.length <= 5) {
      setSelectedChartContentTypes(newSelected);
    } else {
      setSelectedChartContentTypes(newSelected.slice(0, 5));
    }
  };

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
            {isFetchingContentTypes ? (
              <LoadingSpinner />
            ) : (
              <>
                <ContentTypeSelector
                  selectedContentTypes={selectedChartContentTypes}
                  onSelectionChange={handleContentTypeSelection}
                  sdk={sdk as unknown as ConfigAppSDK}
                />
                {newEntries.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ChartWrapper
                    data={newEntries}
                    xAxisDataKey="date"
                    legendTitle="Content:"
                  />
                )}
              </>
            )}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="byContentType">
          <Box marginTop="spacingM">
            {isFetchingContentTypes ? (
              <LoadingSpinner />
            ) : (
              <>
                <ContentTypeSelector
                  selectedContentTypes={selectedChartContentTypes}
                  onSelectionChange={handleContentTypeSelection}
                  sdk={sdk as unknown as ConfigAppSDK}
                />
                {!contentTypeData?.processedContentTypes ||
                contentTypeData.processedContentTypes.size === 0 ? (
                  <EmptyState />
                ) : (
                  <ChartWrapper
                    data={contentTypeData.data}
                    xAxisDataKey="date"
                    processedContentTypes={contentTypeData.processedContentTypes}
                    legendTitle="Content Types:"
                  />
                )}
              </>
            )}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="byCreator">
          <Box marginTop="spacingM">
            {isLoadingUsers ? (
              <LoadingSpinner />
            ) : creatorData.creators.length === 0 ? (
              <EmptyState />
            ) : (
              <ChartWrapper data={creatorData.data} xAxisDataKey="date" legendTitle="Creators:" />
            )}
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

const EmptyState: React.FC = () => {
  return (
    <Flex style={styles.emptyStateContainer}>
      <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold">
        No data to display
      </Text>
      <Paragraph>Data will display once you select content types</Paragraph>
    </Flex>
  );
};

const LoadingSpinner: React.FC = () => {
  return (
    <Flex padding="spacingL" justifyContent="center">
      <Spinner size="medium" />
    </Flex>
  );
};

interface ContentTypeSelectorProps {
  selectedContentTypes: ContentType[];
  onSelectionChange: (contentTypes: ContentType[]) => void;
  sdk: ConfigAppSDK;
}

const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({
  selectedContentTypes,
  onSelectionChange,
  sdk,
}) => {
  return (
    <FormControl marginBottom="spacingM" style={styles.formControlPadding}>
      <FormControl.Label>Content types</FormControl.Label>
      <ContentTypeMultiSelect
        selectedContentTypes={selectedContentTypes}
        setSelectedContentTypes={onSelectionChange}
        sdk={sdk}
        initialSelectedIds={selectedContentTypes.map((ct) => ct.id)}
      />
      <FormControl.HelpText>You can select up to five at a time.</FormControl.HelpText>
    </FormControl>
  );
};
