import { useState } from 'react';
import { Box, DisplayText, Flex, Paragraph, Select } from '@contentful/f36-components';
import { DateRangeType } from 'types';

interface Props {
  metricName: string;
  metricValue: string;
  handleChange: Function
}

const ChartHeader = (props: Props) => {
  const { metricName, metricValue, handleChange } = props;

  const [dateSelection, setDateSelection] = useState<DateRangeType>('lastWeek');

  const handleOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDateSelection(event.target.value as DateRangeType);
    handleChange(event.target.value as DateRangeType);
  }

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
};

export default ChartHeader;
