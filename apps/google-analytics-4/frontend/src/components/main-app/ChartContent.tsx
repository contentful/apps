import { DateRangeType, Row, RunReportResponse } from '@/types';
import { useEffect, useState } from 'react';
import LineChart from './LineChart/LineChart';

interface Props {
    pageViewData: RunReportResponse;
    dateRange: DateRangeType;
}

const ChartContent = (props: Props) => {
    const { pageViewData, dateRange } = props;
    const [dataValues, setDataValues] = useState<RunReportResponse>(pageViewData);

    const parseRowViews = (): number[] => {
        return dataValues.rows.map((r: Row) => +r.metricValues[0].value)
    }

    const parseRowDates = (): string[] => {
        return dataValues.rows.map((r: Row) => {
            const d = r.dimensionValues[0].value;
            return new Date(`${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`).toLocaleDateString('en-us', { month: "short", day: "numeric" })
        })
    }

    useEffect(() => {
        sliceByDateRange(dateRange)
    }, [dateRange]);

    const sliceByDateRange = (dateRange: DateRangeType) => {
        let newRows: Row[] = [];
        switch (dateRange) {
            case 'lastDay':
                newRows = pageViewData.rows.slice(0, 2);
                break;
            case 'lastWeek':
                newRows = pageViewData.rows.slice(0, 7);
                break;
            case 'lastMonth':
                newRows = pageViewData.rows.slice(0, 28);
                break;
        }
        setDataValues({ ...pageViewData, rows: [...newRows] });
    }

    return (
        <>
            {pageViewData.rowCount ?
                <LineChart dataValues={parseRowViews()} xAxisLabels={parseRowDates()} tooltipMetricLabel={''}
                    accessibilityLabel={''} />
                : null}

        </>
    )
}

export default ChartContent;