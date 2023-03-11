export interface RunReportResponse {
  dimensionHeaders: string[];
  metricHeaders: {
    name: string;
    type: string;
  }[];
  rows: {
    dimensionValues: [];
    metricValues: [
      {
        value: number;
        oneValue: string;
      }
    ];
  }[];
  totals: [];
  maximums: [];
  minimums: [];
  rowCount: number;
  metadata: {
    dataLossFromOtherRow: boolean;
    currencyCode: string;
    _currencyCode: string;
    timeZone: string;
    _timeZone: string;
  };
  propertyQuota: string | null;
  kind: string;
}

export interface ReportRow {
  dimensionValues: string[];
  metricValues: {
    value: number;
    oneValue: string;
  }[];
}
