import React, { useEffect, useMemo, useState } from 'react';
import { Box, Flex, FormControl, Spinner, Tabs, Select, Tooltip } from '@contentful/f36-components';
import { InfoIcon } from '@contentful/f36-icons';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { ChartWrapper } from './ChartWrapper';
import {
  generateNewEntriesChartData,
  generateContentTypeChartData,
  generateCreatorChartData,
  getFilteredCreatorDataByView,
} from '../utils/trendsDataProcessor';
import { TimeRange, CreatorViewSetting } from '../utils/types';
import { CREATOR_VIEW_OPTIONS } from '../utils/consts';
import { getUniqueUserIdsFromEntries } from '../utils/EntryUtils';
import { formatUserName } from '../utils/UserUtils';

import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK, HomeAppSDK } from '@contentful/app-sdk';
import ContentTypeMultiSelect, { ContentType } from './ContentTypeMultiSelect';
import { styles } from './ContentTrendsTabs.styles';
import { Multiselect } from '@contentful/f36-multiselect';
import { useUsers } from '../hooks/useUsers';
import { EmptyState } from './EmptyState';

export interface ContentTrendsTabsProps {
  entries: EntryProps[];
  timeRange: TimeRange;
  defaultContentTypes: string[];
  contentTypes: Map<string, ContentTypeProps>;
  isFetchingContentTypes: boolean;
  defaultCreatorViewSetting: CreatorViewSetting;
}

export const ContentTrendsTabs: React.FC<ContentTrendsTabsProps> = ({
  entries,
  defaultContentTypes,
  timeRange,
  contentTypes,
  isFetchingContentTypes,
  defaultCreatorViewSetting,
}) => {
  const sdk = useSDK<HomeAppSDK>();
  const [selectedTab, setSelectedTab] = useState('newEntries');

  const [selectedChartContentTypes, setSelectedChartContentTypes] = useState<ContentType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [creatorView, setCreatorView] = useState<CreatorViewSetting>(defaultCreatorViewSetting);
  const [selectedAlphabeticalCreators, setSelectedAlphabeticalCreators] = useState<string[]>([]);

  const userIds = useMemo(() => getUniqueUserIdsFromEntries(entries), [entries]);
  const { usersMap, isFetching: isLoadingUsers } = useUsers(userIds);

  const creatorsNames = useMemo(() => {
    const newCreatorsNames = new Map<string, string>();
    usersMap.forEach((user, id) => {
      newCreatorsNames.set(id, formatUserName(user));
    });
    return newCreatorsNames;
  }, [usersMap]);

  useEffect(() => {
    if (contentTypes.size > 0 && !isInitialized) {
      let initialSelected: ContentType[] = Array.from(contentTypes.entries())
        .map(([id, contentType]) => ({ id, name: contentType.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 5);

      if (defaultContentTypes && defaultContentTypes.length > 0) {
        initialSelected = defaultContentTypes
          .map((id) => {
            const contentType = contentTypes.get(id);
            return contentType ? { id, name: contentType.name } : null;
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
    const filtered = new Map<string, ContentTypeProps>();
    selectedChartContentTypes.forEach((ct) => {
      const contentType = contentTypes.get(ct.id);
      if (contentType) {
        filtered.set(ct.id, contentType);
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
    return generateCreatorChartData(entries, { timeRange }, creatorsNames);
  }, [entries, timeRange, creatorsNames]);

  const visibleCreatorData = useMemo(() => {
    return getFilteredCreatorDataByView(creatorData, creatorView, selectedAlphabeticalCreators);
  }, [creatorData, creatorView, selectedAlphabeticalCreators]);

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

  const handleCreatorViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CreatorViewSetting;
    setCreatorView(value);
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
                  <EmptyState helperText="Data will display once you select content types." />
                ) : (
                  <ChartWrapper
                    data={newEntries}
                    xAxisDataKey="date"
                    legendTitle="Content:"
                    inNewEntriesTab
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
                  <EmptyState helperText="Data will display once you select content types." />
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
            ) : (
              <>
                <Flex alignItems="flex-start" gap="spacingM">
                  <FormControl marginBottom="spacingM" style={styles.formControlPadding}>
                    <FormControl.Label marginBottom="spacingM">View by</FormControl.Label>
                    <Select value={creatorView} onChange={handleCreatorViewChange}>
                      {CREATOR_VIEW_OPTIONS.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormControl>

                  {creatorView === CreatorViewSetting.Alphabetical && (
                    <FormControl marginBottom="spacingM" style={styles.formControlPadding}>
                      <Flex alignItems="center" gap="spacing2Xs" marginBottom="spacingXs">
                        <FormControl.Label>Select creators</FormControl.Label>
                        <Tooltip content="You can select up to five at a time.">
                          <InfoIcon size="tiny" />
                        </Tooltip>
                      </Flex>
                      <CreatorMultiSelect
                        allCreators={creatorData.creators}
                        selectedCreators={selectedAlphabeticalCreators}
                        onChange={setSelectedAlphabeticalCreators}
                      />
                    </FormControl>
                  )}
                </Flex>

                {visibleCreatorData.creators.length === 0 ? (
                  <EmptyState helperText="Data will display once you select creators." />
                ) : (
                  <ChartWrapper
                    data={visibleCreatorData.data}
                    xAxisDataKey="date"
                    legendTitle="Creators:"
                  />
                )}
              </>
            )}
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

interface CreatorMultiSelectProps {
  allCreators: string[];
  selectedCreators: string[];
  onChange: (creators: string[]) => void;
}

const CreatorMultiSelect: React.FC<CreatorMultiSelectProps> = ({
  allCreators,
  selectedCreators,
  onChange,
}) => {
  const getPlaceholderText = () => {
    if (selectedCreators.length === 0) return 'Select creators';
    if (selectedCreators.length === 1) return selectedCreators[0];
    return `${selectedCreators[0]} and ${selectedCreators.length - 1} more`;
  };

  const handleSelect = (creator: string, checked: boolean) => {
    if (checked) {
      if (selectedCreators.length < 5 && !selectedCreators.includes(creator)) {
        onChange([...selectedCreators, creator]);
      }
    } else {
      onChange(selectedCreators.filter((c) => c !== creator));
    }
  };

  const isAtMax = selectedCreators.length >= 5;

  return (
    <Multiselect placeholder={getPlaceholderText()}>
      {allCreators.map((creator) => {
        const isSelected = selectedCreators.includes(creator);
        const isDisabled = !isSelected && isAtMax;

        return (
          <Multiselect.Option
            key={creator}
            value={creator}
            itemId={creator}
            isChecked={isSelected}
            isDisabled={isDisabled}
            onSelectItem={(e) => handleSelect(creator, e.target.checked)}>
            {creator}
          </Multiselect.Option>
        );
      })}
    </Multiselect>
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
      <Flex alignItems="center" gap="spacing2Xs">
        <FormControl.Label>Content types</FormControl.Label>
        <Tooltip content="You can select up to five at a time.">
          <InfoIcon size="tiny" />
        </Tooltip>
      </Flex>
      <ContentTypeMultiSelect
        selectedContentTypes={selectedContentTypes}
        setSelectedContentTypes={onSelectionChange}
        sdk={sdk}
        initialSelectedIds={selectedContentTypes.map((ct) => ct.id)}
        maxSelected={5}
        disablePills
      />
    </FormControl>
  );
};
