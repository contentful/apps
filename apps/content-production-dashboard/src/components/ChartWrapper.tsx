import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Box, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { styles, CHART_COLORS } from './ChartWrapper.styles';
import type { ChartWrapperProps } from '../utils/types';

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  data,
  xAxisDataKey,
  processedContentTypes,
  height = 400,
  legendTitle,
}) => {
  const contentTypesIds = useMemo<string[]>(() => {
    if (processedContentTypes) {
      return Array.from(processedContentTypes.keys());
    }

    if (data.length === 0) {
      return [];
    }

    const firstPointKeys = Object.keys(data[0]);
    return firstPointKeys.filter((key) => key !== xAxisDataKey).sort();
  }, [data, xAxisDataKey, processedContentTypes]);

  const contentTypesNames = useMemo<string[]>(() => {
    return processedContentTypes ? Array.from(processedContentTypes.values()) : contentTypesIds;
  }, [processedContentTypes, contentTypesIds]);

  const colors = useMemo(() => {
    return contentTypesIds.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]);
  }, [contentTypesIds.length]);

  return (
    <Flex flexDirection="row" alignItems="flex-start">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 35 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray200} />
          <XAxis
            dataKey={xAxisDataKey}
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {contentTypesIds.map((key, index) => (
            <Line
              key={`${key}-${index}`}
              type="linear"
              dataKey={key}
              data-testid={`line-${key}`}
              stroke={colors[index]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}>
              <LabelList
                position="top"
                offset={10}
                fontSize={12}
                formatter={(value) => (value != null && value !== 0 ? String(value) : '')}
              />
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>

      {legendTitle && (
        <Flex flexDirection="column" style={styles.legendContainer}>
          <Text
            fontSize="fontSizeM"
            fontColor="gray600"
            fontWeight="fontWeightDemiBold"
            marginBottom="spacingXs">
            {legendTitle}
          </Text>
          {contentTypesNames.map((name: string, index: number) => (
            <Flex
              key={`${name}-${index}`}
              alignItems="center"
              gap="spacing2Xs"
              marginBottom="spacingXs">
              <Box
                style={{
                  ...styles.legendDot,
                  backgroundColor: colors[index],
                }}
              />
              <Text fontSize="fontSizeM" fontColor="gray700">
                {name}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
