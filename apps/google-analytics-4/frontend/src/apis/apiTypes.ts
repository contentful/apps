import { z } from 'zod';

export type Headers = Record<string, string>;

export const ZCredentials = z.object({
  status: z.string(),
});
export type Credentials = z.infer<typeof ZCredentials>;

const ZPropertySummary = z.object({
  property: z.string(),
  displayName: z.string(),
  propertyType: z.string(),
});
export type PropertySummary = z.infer<typeof ZPropertySummary>;

const ZAccountSummary = z.object({
  name: z.string(),
  account: z.string(),
  displayName: z.string(),
  propertySummaries: z.array(ZPropertySummary),
});
export const ZAccountSummaries = z.array(ZAccountSummary);
export type AccountSummaries = z.infer<typeof ZAccountSummaries>;

const ZRow = z.object({
  dimensionValues: z.array(
    z.object({
      value: z.string(),
      oneValue: z.string(),
    })
  ),
  metricValues: z.array(
    z.object({
      value: z.string(),
      oneValue: z.string(),
    })
  ),
});

export const ZRunReportData = z.object({
  dimensionHeaders: z.array(z.object({ name: z.string() })),
  metricHeaders: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
    })
  ),
  rows: z.array(ZRow),
  totals: z.array(ZRow),
  maximums: z.array(ZRow),
  minimums: z.array(ZRow),
  rowCount: z.number(),
  metadata: z.object({
    currencyCode: z.string(),
    dataLossFromOtherRow: z.boolean(),
    timeZone: z.string(),
    _currencyCode: z.string(),
    _timeZone: z.string(),
  }),
  propertyQuota: z.null(),
  kind: z.string(),
});

export type RunReportData = z.infer<typeof ZRunReportData>;

// TODO: more comprehensive recognization of known failures (ie. Stale/bad account data, lambda unavailable, transient, non-transient errors, timeouts)
// NOTE: This needs to be in sync with the lambda - ie copy and pasted
export const ERROR_TYPE_MAP = {
  // Google errors
  unknown: 'Unknown',
  unexpected: 'Unexpected',
  failedFetch: 'FailedFetch',
  malformedApiResponse: 'MalformedApiResponse',
  invalidJson: 'InvalidJson',
  disabledAdminApi: 'DisabledAdminApi',
  disabledDataApi: 'DisabledDataApi',
  noAccountsOrPropertiesFound: 'NoAccountsOrPropertiesFound',
  invalidProperty: 'InvalidProperty',
  invalidServiceAccount: 'InvalidServiceAccount',
  // Lambda errors
  invalidServiceAccountKey: 'InvalidServiceAccountKey',
  missingServiceAccountKeyFile: 'MissingServiceAccountKeyFile',
};

export const ZApiError = z.object({
  details: z.any(),
  errorType: z.string(),
  message: z.string(),
  status: z.number(),
});
export type ApiErrorType = z.infer<typeof ZApiError>;

export const ZApiErrorResponse = z.object({
  errors: ZApiError,
});
export type ApiErrorResponse = z.infer<typeof ZApiErrorResponse>;

export function isApiErrorType(error: any): error is ApiErrorType {
  return ZApiError.safeParse(error).success;
}
