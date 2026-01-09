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
import { ChartTooltip } from './ChartTooltip';
import { Box, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { styles } from './ChartWrapper.styles';

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartWrapperProps {
  data: ChartDataPoint[];
  xAxisDataKey: string;
  linesLegends: string[];
  height?: number;
  legendTitle?: string;
}

const CHART_COLORS = [
  '#4A90E2', // Blue
  '#50C878', // Green
  '#FF6B6B', // Red
  '#FFA500', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E74C3C', // Dark Red
  '#3498DB', // Light Blue
  '#F39C12', // Dark Orange
  '#16A085', // Dark Teal
];

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  data,
  xAxisDataKey,
  linesLegends,
  height = 400,
  legendTitle,
}) => {
  const colors = useMemo(() => {
    return linesLegends.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]);
  }, [linesLegends.length]);

  const isOverallTrends = linesLegends.length === 1 && linesLegends[0] === 'New Content';
  const tooltipContent = ({ active, payload, label }: any) => (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      data={data}
      valueKey={isOverallTrends ? linesLegends[0] : undefined}
      linesLegends={linesLegends}
      colors={colors}
      isOverallTrends={isOverallTrends}
    />
  );

  return (
    <Flex flexDirection="row" alignItems="flex-start">
      <Box style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray200} />
            <XAxis
              dataKey={xAxisDataKey}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={tooltipContent} />
            {linesLegends.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
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
      </Box>

      {legendTitle && (
        <Flex flexDirection="column" style={{ width: '18%' }}>
          <Text
            fontSize="fontSizeM"
            fontColor="gray600"
            fontWeight="fontWeightDemiBold"
            marginBottom="spacingXs">
            {legendTitle}
          </Text>
          {linesLegends.map((key, index) => (
            <Flex key={key} alignItems="center" gap="spacing2Xs" marginBottom="spacingXs">
              <Box
                style={{
                  ...styles.legendDot,
                  backgroundColor: colors[index],
                }}
              />
              <Text fontSize="fontSizeM" fontColor="gray700">
                {key}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
