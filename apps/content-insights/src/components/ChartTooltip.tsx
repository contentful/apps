import React from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { ChartDataPoint } from '../utils/types';

export interface TooltipPayloadItem {
  value: number;
  name: string;
  dataKey?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  data?: ChartDataPoint[];
  valueKey?: string;
  inNewEntriesTab?: boolean;
  processedContentTypes?: Map<string, string>;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload: tooltipItems,
  label,
  data,
  valueKey,
  inNewEntriesTab,
  processedContentTypes,
}) => {
  if (inNewEntriesTab && data && valueKey) {
    return <NewEntriesTooltip active={active} label={label} data={data} valueKey={valueKey} />;
  }

  if (!active || !tooltipItems || !tooltipItems.length || !label) {
    return null;
  }

  return (
    <DefaultTooltip
      tooltipItems={tooltipItems}
      label={label}
      processedContentTypes={processedContentTypes}
    />
  );
};

const DefaultTooltip: React.FC<{
  tooltipItems: TooltipPayloadItem[];
  label: string;
  processedContentTypes?: Map<string, string>;
}> = ({ tooltipItems, label, processedContentTypes }) => {
  return (
    <Flex
      flexDirection="column"
      gap="spacing2Xs"
      style={{
        backgroundColor: tokens.colorWhite,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.gray300}`,
      }}>
      {/* Date Header */}
      <Box
        style={{ backgroundColor: tokens.gray100, borderBottom: `1px solid ${tokens.gray300}` }}
        padding="spacingXs">
        <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
          {label}
        </Text>
      </Box>

      {/* Content Section */}
      <Flex flexDirection="column" gap="spacing2Xs" padding="spacingXs">
        {tooltipItems.map((item, index) => {
          const displayName =
            (item.dataKey && processedContentTypes?.get(item.dataKey)) || item.name;
          return (
            <Text
              key={index}
              fontSize="fontSizeS"
              fontColor="gray700"
              style={item.color ? { color: item.color } : undefined}>
              {displayName}: {item.value}
            </Text>
          );
        })}
      </Flex>
    </Flex>
  );
};

const NewEntriesTooltip: React.FC<{
  active?: boolean;
  label?: string;
  data: ChartDataPoint[];
  valueKey: string;
}> = ({ active, label, data, valueKey }) => {
  if (!active || !label) {
    return null;
  }

  const currentDataPoint = data.find((d) => d.date === label);
  if (!currentDataPoint) return null;

  const currentValue = currentDataPoint[valueKey] as number;
  const avgTimeToPublish = currentDataPoint['avgTimeToPublish'] as number | undefined;
  const newContentChange = currentDataPoint['newContentChange'] as number | undefined;
  const avgTimeToPublishChange = currentDataPoint['avgTimeToPublishChange'] as number | undefined;

  const formatPercentage = (value: number): string => {
    if (value === undefined) return '';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Flex
      flexDirection="column"
      gap="spacing2Xs"
      style={{
        backgroundColor: tokens.colorWhite,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.gray300}`,
      }}>
      {/* Date Header */}
      <Box
        style={{ backgroundColor: tokens.gray100, borderBottom: `1px solid ${tokens.gray300}` }}
        padding="spacingXs">
        <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
          {label}
        </Text>
      </Box>

      {/* New Entries Section */}
      <Flex
        flexDirection="column"
        gap="spacing2Xs"
        padding="spacingXs"
        style={{ borderBottom: `1px solid ${tokens.gray300}` }}>
        <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
          {currentValue.toLocaleString()} new entries
        </Text>
        {newContentChange !== undefined && (
          <Text fontSize="fontSizeM" fontColor={newContentChange >= 0 ? 'green600' : 'red600'}>
            {formatPercentage(newContentChange)} from previous month
          </Text>
        )}
      </Flex>

      {/* Average Time to Publish Section */}
      {avgTimeToPublish !== undefined && (
        <Flex flexDirection="column" padding="spacingXs">
          <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
            {avgTimeToPublish.toFixed(1)} days
          </Text>
          <Text fontSize="fontSizeM" fontColor="gray600">
            Average time to publish
          </Text>
          {avgTimeToPublishChange !== undefined && (
            <Text
              fontSize="fontSizeM"
              fontColor={avgTimeToPublishChange >= 0 ? 'green600' : 'red600'}>
              {formatPercentage(avgTimeToPublishChange)} from previous month
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  );
};
