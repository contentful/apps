import { useState, useEffect } from 'react';
import { Box, DisplayText, Flex, Paragraph, Select } from '@contentful/f36-components';
import { DateRangeType } from 'types';
import { styles } from './ChartHeader.styles';

interface Props {
  metricName: string;
  metricValue: string;
  handleChange: Function;
  selectedDateRange?: DateRangeType;
}

const getMetricDisplayString = (_metricName: string) => {
  switch (_metricName) {
    case 'screenPageViews':
      return 'Total Views';
    default:
      return 'Undetermined metric';
  }
};

const ChartHeader = (props: Props) => {
  const { metricName, metricValue, handleChange, selectedDateRange } = props;

  const [dateSelection, setDateSelection] = useState<DateRangeType>('lastWeek');

  const handleOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDateSelection(event.target.value as DateRangeType);
    handleChange(event.target.value as DateRangeType);
  };

  useEffect(() => {
    if (selectedDateRange) setDateSelection(selectedDateRange);
  }, [selectedDateRange]);

  return (
    <Flex
      justifyContent="space-between"
      alignItems="flex-end"
      marginBottom="spacingS"
      id="chart-header">
      <Box>
        <DisplayText marginBottom="none" size="large">
          {metricValue}
        </DisplayText>
        <Paragraph marginBottom="none">{getMetricDisplayString(metricName)}</Paragraph>
      </Box>
      <Select
        className={styles.root}
        id="daterange"
        name="daterange"
        value={dateSelection}
        onChange={handleOnChange}>
        <Select.Option value="lastDay">Last 24 hours</Select.Option>
        <Select.Option value="lastWeek">Last 7 days</Select.Option>
        <Select.Option value="lastMonth">Last 28 days</Select.Option>
      </Select>
    </Flex>
  );
};

export default ChartHeader;
