import { DateRangeType, Row, RunReportResponse } from '@/types';
import LineChart from './LineChart/LineChart';

interface Props {
    pageViewData: RunReportResponse;
    dateRange: DateRangeType;
}

const ChartContent = (props: Props) => {
    const { pageViewData, dateRange } = props;

    const parseRowViews = (): number[] => {
        return pageViewData.rows.map((r: Row) => +r.metricValues[0].value)
    }

    const parseRowDates = (): string[] => {
        return pageViewData.rows.map((r: Row) => {
            const d = r.dimensionValues[0].value;
            return new Date(`${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`).toLocaleDateString('en-us', { month: "short", day: "numeric" })
        })
    }

    return (
        <>
            <LineChart dataValues={parseRowViews()} xAxisLabels={parseRowDates()} tooltipMetricLabel={''}
                accessibilityLabel={''} />

        </>
    )
}

export default ChartContent;