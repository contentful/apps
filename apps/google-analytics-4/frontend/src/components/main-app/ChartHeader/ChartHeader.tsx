import { useState, useEffect } from 'react';
import { Box, Button, DisplayText, Flex, Paragraph, Select, Text } from '@contentful/f36-components';
import { AnalyticsMetricType, DateRangeType, StartEndDates } from 'types';
import { DATE_RANGE_SELECT_OPTIONS, DateRange } from 'helpers/DateRangeHelpers/DateRangeHelpers';
import { styles } from './ChartHeader.styles';

interface Props {
  metricName: string;
  metricValue: string;
  handleChange: (range: DateRangeType) => void;
  handleMetricChange: (metric: AnalyticsMetricType) => void;
  handleCustomRangeRequest: () => void;
  startEndDates: StartEndDates;
  selectedDateRange?: DateRangeType;
  selectedMetric?: AnalyticsMetricType;
}

const getMetricDisplayString = (_metricName: string) => {
  switch (_metricName) {
    case 'screenPageViews':
      return 'Total Views';
    case 'activeUsers':
      return 'Unique Views';
    default:
      return 'Undetermined metric';
  }
};

const ChartHeader = (props: Props) => {
  const {
    metricName,
    metricValue,
    handleChange,
    handleMetricChange,
    handleCustomRangeRequest,
    startEndDates,
    selectedDateRange,
    selectedMetric = 'screenPageViews',
  } = props;
  const [dateSelection, setDateSelection] = useState<DateRangeType>('lastWeek');
  const [metricSelection, setMetricSelection] = useState<AnalyticsMetricType>(selectedMetric);

  const handleOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDateRange = event.target.value as DateRangeType;
    if (nextDateRange === DateRange.Custom) {
      handleCustomRangeRequest();
      return;
    }

    setDateSelection(nextDateRange);
    handleChange(nextDateRange);
  };

  const handleMetricSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMetric = event.target.value as AnalyticsMetricType;
    setMetricSelection(nextMetric);
    handleMetricChange(nextMetric);
  };

  useEffect(() => {
    if (selectedDateRange) setDateSelection(selectedDateRange);
  }, [selectedDateRange]);

  useEffect(() => {
    setMetricSelection(selectedMetric);
  }, [selectedMetric]);

  return (
    <Flex
      justifyContent="space-between"
      alignItems="flex-start"
      marginBottom="spacingS"
      id="chart-header">
      <Box>
        <DisplayText marginBottom="none" size="large">
          {metricValue}
        </DisplayText>
        <Paragraph marginBottom="none">{getMetricDisplayString(metricName)}</Paragraph>
      </Box>
      <Flex flexDirection="column" className={styles.controls}>
        <Select
          className={styles.root}
          id="metric"
          name="metric"
          value={metricSelection}
          onChange={handleMetricSelect}>
          <Select.Option value="screenPageViews">Total views</Select.Option>
          <Select.Option value="activeUsers">Unique views</Select.Option>
        </Select>
        <Select
          className={styles.root}
          id="daterange"
          name="daterange"
          value={dateSelection}
          onChange={handleOnChange}>
          {DATE_RANGE_SELECT_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <Flex
          className={`${styles.customRangeRow} ${
            dateSelection === DateRange.Custom ? styles.customRangeRowVisible : styles.customRangeRowHidden
          }`}>
          <Text fontColor="gray700" className={styles.customRangeSummary}>
            {startEndDates.start} to {startEndDates.end}
          </Text>
          <Button
            size="small"
            variant="secondary"
            className={styles.customRangeButton}
            onClick={handleCustomRangeRequest}
            isDisabled={dateSelection !== DateRange.Custom}
            tabIndex={dateSelection === DateRange.Custom ? 0 : -1}>
            Choose dates
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ChartHeader;
