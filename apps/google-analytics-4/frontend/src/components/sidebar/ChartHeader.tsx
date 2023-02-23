import { useState } from 'react';
import { Box, DisplayText, Flex, Paragraph, Select } from '@contentful/f36-components';

interface Props {
  metricName: string;
  metricValue: string;
}

export default function ChartHeader(props: Props) {
  const { metricName, metricValue } = props;

  const [dateSelection, setDateSelection] = useState('lastWeek');

  const handleOnChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
    setDateSelection(event.target.value);

  return (
    <Flex
      justifyContent="space-between"
      alignItems="flex-end"
      marginBottom="spacingXs"
      id="chart-header"
    >
      <Box>
        <DisplayText marginBottom="none" size="large">
          {metricValue}
        </DisplayText>
        <Paragraph marginBottom="none">{metricName}</Paragraph>
      </Box>
      <Select id="daterange" name="daterange" value={dateSelection} onChange={handleOnChange}>
        <Select.Option value="lastDay">Last 24 hours</Select.Option>
        <Select.Option value="lastWeek">Last 7 days</Select.Option>
        <Select.Option value="lastMonth">Last 28 days</Select.Option>
      </Select>
    </Flex>
  );
}
