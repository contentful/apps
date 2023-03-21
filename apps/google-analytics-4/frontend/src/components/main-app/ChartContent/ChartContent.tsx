import { Row, RunReportResponse } from 'types';
import Note from 'components/common/Note/Note';
import LineChart from 'components/main-app/LineChart/LineChart';
import { parseDayAndMonth } from 'helpers/DateHelpers/DateHelpers';
import { DEFAULT_ERR_MSG, EMPTY_DATA_MSG } from '../constants/noteMessages';

interface Props {
  pageViewData: RunReportResponse;
  error?: Error;
}

const ChartContent = (props: Props) => {
  const { pageViewData, error } = props;

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

  const renderChartContent = () => {
    if (error) {
      return <Note body={error?.message || DEFAULT_ERR_MSG} variant="negative" />;
    }

    if (!pageViewData.rowCount) {
      return <Note body={EMPTY_DATA_MSG} variant="warning" />;
    }

    return (
      <LineChart
        dataValues={parseRowViews()}
        xAxisLabels={parseRowDates()}
        tooltipMetricLabel="Page views:"
        accessibilityLabel="Analytics line chart"
      />
    );
  };

  return renderChartContent();
};

export default ChartContent;
