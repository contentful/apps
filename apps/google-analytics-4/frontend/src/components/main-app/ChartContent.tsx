import { Row, RunReportResponse } from '@/types';
import LineChart from '@/components/main-app/LineChart/LineChart';

interface Props {
    pageViewData: RunReportResponse;
}

const ChartContent = (props: Props) => {
    const { pageViewData } = props;

    function parseRows(rows: Row[]): number[] {
        debugger;
        return rows.map((r: Row) => +r.metricValues[0].value)
    }

    return (
        <>
            {pageViewData.rowCount ? <LineChart dataValues={parseRows(pageViewData.rows)} xAxisLabels={['mockLabels']} tooltipMetricLabel={''}
                accessibilityLabel={''} /> : null}

        </>
    )
}

export default ChartContent;