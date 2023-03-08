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

// TODO: Update once we know exactly the shape of the run report GA data
export const ZRunReportData = z.object({});
export type RunReportData = z.infer<typeof ZRunReportData>;

// TODO: more comprehensive recognization of known failures (ie. Stale/bad account data, lambda unavailable, transient, non-transient errors, timeouts)
// NOTE: This needs to be in sync with the lambda - ie copy and pasted
export const ERROR_TYPE_MAP = {
  unknown: 'Unknown',
  unexpected: 'Unexpected Response from Server',
  failedFetch: 'Failed fetch',
  malformedApiResponse: 'Invalid response API',
  invalidJson: 'Invalid json from API',
  disabledAdminApi: 'Disabled Admin Api',
  disabledDataApi: 'Disabled Data Api',
  noAccountsOrPropertiesFound: 'No accounts/properties found',
  invalidServiceAccount: 'Invalid service account',
};

const ZErrorTypesType = z.union([
  z.literal(ERROR_TYPE_MAP.unknown),
  z.literal(ERROR_TYPE_MAP.disabledAdminApi),
  z.literal(ERROR_TYPE_MAP.disabledDataApi),
  z.literal(ERROR_TYPE_MAP.noAccountsOrPropertiesFound),
]);

export const ZApiError = z.object({
  details: z.any(),
  errorType: ZErrorTypesType,
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
