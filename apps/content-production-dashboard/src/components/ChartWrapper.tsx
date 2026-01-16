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

  return (
    <Flex flexDirection="row" alignItems="flex-start">
      <Box style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 35, right: 35 }}>
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
            {linesLegends.map((key, index) => (
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
      </Box>

      {legendTitle && (
        <Flex flexDirection="column" style={styles.legendContainer}>
          <Text
            fontSize="fontSizeM"
            fontColor="gray600"
            fontWeight="fontWeightDemiBold"
            marginBottom="spacingXs">
            {legendTitle}
          </Text>
          {linesLegends.map((key, index) => (
            <Flex
              key={`${key}-${index}`}
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
                {key}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
