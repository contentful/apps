

const ChartContent = (props) => {
    const { pageViewData } = props;

    function parseRows(rows: ReportRow[]): number[] {
        debugger;
        return rows.map((r: ReportRow) => r.metricValues[0].value)
    }

    return (
        <>
            {pageViewData.rowCount ? <LineChart dataValues={parseRows(pageViewData.rows)} xAxesLabels={mockLabels} /> : null}

        </>
    )
}