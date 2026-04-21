import ChartFooter from 'components/main-app/ChartFooter/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader/ChartHeader';
import ChartContent from '../ChartContent/ChartContent';
import { AnalyticsMetricType, RunReportResponse, StartEndDates, DateRangeType } from 'types';
import { getExternalUrl } from 'helpers/externalUrlHelpers/externalUrlHelpers';

interface Props {
  handleDateRangeChange: (range: DateRangeType) => void;
  handleMetricChange: (metric: AnalyticsMetricType) => void;
  handleCustomRangeRequest: () => void;
  runReportResponse: RunReportResponse;
  reportSlug: string;
  includedPaths?: string[];
  canOpenInGoogleAnalytics?: boolean;
  pageViews: number;
  metricName: string;
  error?: Error;
  propertyId: string;
  startEndDates: StartEndDates;
  selectedDateRange?: DateRangeType;
  selectedMetric?: AnalyticsMetricType;
  isLoading?: boolean;
}

const AnalyticsMetricDisplay = (props: Props) => {
  const {
    handleDateRangeChange,
    handleMetricChange,
    handleCustomRangeRequest,
    runReportResponse,
    reportSlug,
    includedPaths = [],
    canOpenInGoogleAnalytics = true,
    error,
    metricName,
    pageViews,
    propertyId,
    startEndDates,
    selectedDateRange,
    selectedMetric,
    isLoading = false,
  } = props;
  const safePageViews = Number.isFinite(pageViews) ? pageViews : 0;

  const propertyIdNumber = propertyId.split('/')[1] || '';
  const viewUrl = canOpenInGoogleAnalytics
    ? getExternalUrl(propertyIdNumber, { pagePath: reportSlug, startEndDates })
    : '';

  return (
    <>
      <ChartHeader
        metricName={metricName ? metricName : ''}
        metricValue={Intl.NumberFormat('en', { notation: 'compact' }).format(safePageViews)}
        handleChange={handleDateRangeChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={handleCustomRangeRequest}
        startEndDates={startEndDates}
        selectedDateRange={selectedDateRange}
        selectedMetric={selectedMetric}
      />

      <ChartContent error={error} pageViewData={runReportResponse} isLoading={isLoading} />

      <ChartFooter slugName={reportSlug} includedPaths={includedPaths} viewUrl={viewUrl} />
    </>
  );
};

export default AnalyticsMetricDisplay;
