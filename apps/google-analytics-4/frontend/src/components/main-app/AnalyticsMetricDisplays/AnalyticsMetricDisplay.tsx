import ChartFooter from 'components/main-app/ChartFooter/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader/ChartHeader';
import ChartContent from '../ChartContent/ChartContent';
import { RunReportResponse, StartEndDates, DateRangeType } from 'types';
import { getExternalUrl } from 'helpers/externalUrlHelpers/externalUrlHelpers';

interface Props {
  handleDateRangeChange: Function;
  runReportResponse: RunReportResponse;
  reportSlug: string;
  pageViews: number;
  metricName: string;
  error?: Error;
  propertyId: string;
  startEndDates: StartEndDates;
  selectedDateRange?: DateRangeType;
}

const AnalyticsMetricDisplay = (props: Props) => {
  const {
    handleDateRangeChange,
    runReportResponse,
    reportSlug,
    error,
    metricName,
    pageViews,
    propertyId,
    startEndDates,
    selectedDateRange,
  } = props;

  const propertyIdNumber = propertyId.split('/')[1] || '';
  const viewUrl = getExternalUrl(propertyIdNumber, { pagePath: reportSlug, startEndDates });

  return (
    <>
      <ChartHeader
        metricName={metricName ? metricName : ''}
        metricValue={pageViews || pageViews === 0 ? pageViews.toString() : ''}
        handleChange={handleDateRangeChange}
        selectedDateRange={selectedDateRange}
      />

      <ChartContent error={error} pageViewData={runReportResponse} />

      <ChartFooter slugName={reportSlug} viewUrl={viewUrl} />
    </>
  );
};

export default AnalyticsMetricDisplay;
