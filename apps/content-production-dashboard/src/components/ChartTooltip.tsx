import React from 'react';
import { Text, Flex, Card } from '@contentful/f36-components';
import type { ChartDataPoint } from './ChartWrapper';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey?: string; color?: string }>;
  label?: string;
  data?: ChartDataPoint[];
  valueKey?: string;
  linesLegends?: string[];
  colors?: string[];
  inNewEntriesTab?: boolean;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  data,
  valueKey,
  linesLegends,
  colors,
  inNewEntriesTab,
}) => {
  if (inNewEntriesTab && data && valueKey) {
    return (
      <NewEntriesTooltip
        active={active}
        payload={payload}
        label={label}
        data={data}
        valueKey={valueKey}
      />
    );
  }

  const payloadWithColors = payload?.map((item: any) => {
    const lineIndex = linesLegends?.findIndex((key) => key === item.dataKey);
    return {
      ...item,
      color: lineIndex !== undefined && lineIndex >= 0 && colors ? colors[lineIndex] : undefined,
    };
  });

  return <DefaultTooltip active={active} payload={payloadWithColors} label={label} />;
};

const DefaultTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <Card>
      <Flex flexDirection="column" gap="spacing2Xs">
        <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
          {label}
        </Text>
        {payload.map((item, index) => (
          <Text
            key={index}
            fontSize="fontSizeS"
            fontColor="gray700"
            style={item.color ? { color: item.color } : undefined}>
            {item.name}: {item.value}
          </Text>
        ))}
      </Flex>
    </Card>
  );
};

const NewEntriesTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  data: ChartDataPoint[];
  valueKey: string;
}> = ({ active, payload, label, data, valueKey }) => {
  if (!active || !payload || !payload[0]) {
    return null;
  }

  const currentValue = payload[0].value as number;
  const currentIndex = data.findIndex((d) => d.date === label);

  let percentageChange: number | null = null;
  if (currentIndex > 0) {
    const previousValue = (data[currentIndex - 1][valueKey] as number) || 0;
    if (previousValue > 0) {
      percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    } else if (currentValue > 0) {
      percentageChange = 100;
    }
  }

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <Flex flexDirection="column" gap="spacing2Xs">
        <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
          {label}
        </Text>
        <Text fontSize="fontSizeS" fontColor="gray700">
          {currentValue} {currentValue === 1 ? 'new entry' : 'new entries'}
        </Text>
        {percentageChange !== null && (
          <Text fontSize="fontSizeS" fontColor={percentageChange < 0 ? 'red600' : 'green600'}>
            {formatPercentage(percentageChange)} from previous month
          </Text>
        )}
      </Flex>
    </Card>
  );
};
