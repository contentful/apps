import { Row, RunReportResponse } from '@/types';
import LineChart from './line-chart/LineChart';
import { parseDayAndMonth } from 'helpers/DateHelpers/DateHelpers';

interface Props {
  pageViewData: RunReportResponse;
}

const ChartContent = (props: Props) => {
  const { pageViewData } = props;

  const parseRowViews = (): number[] => {
    return pageViewData.rows.map((r: Row) => +r.metricValues[0].value);
  };

  const parseRowDates = (): string[] => {
    return pageViewData.rows.map((r: Row) => {
      const date = r.dimensionValues[0].value;
      const { month, day } = parseDayAndMonth(date);
      return `${month} ${day}`;
    });
  };

  return (
    <>
      <LineChart
        dataValues={parseRowViews()}
        xAxisLabels={parseRowDates()}
        tooltipMetricLabel="Page views:"
        accessibilityLabel="Analytics line chart"
      />
    </>
  );
};

export default ChartContent;
