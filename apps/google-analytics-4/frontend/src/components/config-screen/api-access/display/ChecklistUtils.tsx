import { ApiErrorType } from 'apis/apiTypes';
import {
  CheckCircleIcon,
  ClockIcon,
  ErrorCircleIcon,
  ArrowForwardIcon,
} from '@contentful/f36-icons';
import { KeyValueMap } from 'contentful-management';
import { Flex, Tooltip } from '@contentful/f36-components';

const getErrorIcon = (msg: string) => (
  <Tooltip placement="top" content={msg}>
    <Flex alignItems="center">
      <ErrorCircleIcon
        testId="error-icon"
        marginLeft="spacingXs"
        marginRight="spacingXs"
        variant="negative"
      />
    </Flex>
  </Tooltip>
);
const getSuccessIcon = (msg: string) => (
  <Tooltip placement="top" content={msg}>
    <Flex alignItems="center">
      <CheckCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="positive" />
    </Flex>
  </Tooltip>
);

const getClockIcon = (msg: string) => (
  <Tooltip placement="top" content={msg}>
    <Flex alignItems="center">
      <ClockIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />
    </Flex>
  </Tooltip>
);

const getArrowIcon = (msg: string) => (
  <Tooltip placement="top" content={msg}>
    <Flex alignItems="center">
      <ArrowForwardIcon
        testId="arrow-icon"
        marginLeft="spacingXs"
        marginRight="spacingXs"
        variant="muted"
      />
    </Flex>
  </Tooltip>
);

const CHECKLIST_NAMES = {
  serviceAccount: 'Service Account',
  adminApi: 'Admin API',
  dataApi: 'Data API',
  ga4Properties: 'GA4 Account Properties',
  unknown: 'Unknown',
};

export type ChecklistURL = {
  title: string;
  url: string;
};

export type ChecklistRow = {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled: boolean;
  checklistUrl?: ChecklistURL;
};

export type ChecklistStatus = {
  ServiceKey: {
    success: ChecklistRow;
    invalid: ChecklistRow;
    missing: ChecklistRow;
  };
  AdminApi: {
    success: ChecklistRow;
    firstTimeSetup: ChecklistRow;
    invalidServiceAccount: ChecklistRow;
    error: ChecklistRow;
  };
  DataApi: {
    success: ChecklistRow;
    firstTimeSetup: ChecklistRow;
    invalidServiceAccount: ChecklistRow;
    error: ChecklistRow;
  };
  GA4Properties: {
    success: ChecklistRow;
    firstTimeSetup: ChecklistRow;
    invalidServiceAccount: ChecklistRow;
    adminApiError: ChecklistRow;
    error: ChecklistRow;
    noAccountsOrPropertiesFound: ChecklistRow;
  };
  Other: {
    unknown: ChecklistRow;
  };
};

export const CHECKLIST_STATUSES: ChecklistStatus = {
  ServiceKey: {
    success: {
      icon: getSuccessIcon('Service account is correctly installed'),
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Success!',
      disabled: false,
    },
    invalid: {
      icon: getErrorIcon(
        'Failed to connect to your service account. Re-install your service account key if the problem persists'
      ),
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Invalid service account and service account key',
      disabled: false,
    },
    missing: {
      icon: getErrorIcon(
        'We were unable to retrieve the private key from your service account key file. Please try reinstalling your service account key file. If the problem persists, contact support.'
      ),
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Unable to retrieve service account key file.',
      disabled: false,
    },
  },
  AdminApi: {
    success: {
      icon: getSuccessIcon('Admin API successfully enabled'),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Success!',
      disabled: false,
    },
    firstTimeSetup: {
      icon: getArrowIcon('Please enable the Admin API to run this check'),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Analytics Admin API is not yet enabled',
      disabled: false,
    },
    invalidServiceAccount: {
      icon: getClockIcon(
        'Service account errors detected, please install a correctly configured service account installation'
      ),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Awaiting a correctly configured service account installation',
      disabled: true,
    },
    error: {
      icon: getErrorIcon('Failed to connect to the Admin API - did you enable the api?'),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Analytics Admin API must be enabled to use this app',
      disabled: false,
    },
  },
  DataApi: {
    success: {
      icon: getSuccessIcon('The Analytics Data API is enabled'),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Success!',
      disabled: false,
    },
    firstTimeSetup: {
      icon: getArrowIcon('Please enable the Data API to run this check'),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Analytics Data API is not yet enabled',
      disabled: false,
    },
    invalidServiceAccount: {
      icon: getClockIcon(
        'Service account errors detected, please install a correctly configured service account installation'
      ),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Awaiting a correctly configured service account installation',
      disabled: true,
    },
    error: {
      icon: getErrorIcon('Failed to connect to the Data API - did you enable the api?'),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Analytics Data API must be enabled to use this app',
      disabled: false,
    },
  },
  GA4Properties: {
    success: {
      icon: getSuccessIcon(
        'Your service account has access to assign a Google Analytics 4 property'
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Success!',
      disabled: false,
      checklistUrl: {
        title: 'Details',
        url: 'https://analytics.google.com/analytics/web/',
      },
    },
    firstTimeSetup: {
      icon: getClockIcon(`Check will run once the ${CHECKLIST_NAMES.adminApi} is enabled`),
      title: CHECKLIST_NAMES.ga4Properties,
      description: `Enable Analytics Admin API to run this check`,
      disabled: true,
    },
    invalidServiceAccount: {
      icon: getClockIcon(
        'Service account errors detected, please install a correctly configured service account installation'
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Awaiting a correctly configured service account installation',
      disabled: true,
    },
    adminApiError: {
      icon: getClockIcon('This check requires the admin api to be enabled'),
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Enable Analytics Admin API to run this check',
      disabled: true,
    },
    error: {
      icon: getErrorIcon(
        'The service account must have properties assigned to the account for this check to pass'
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: "Service account doesn't have access to any GA4 properties",
      disabled: false,
      checklistUrl: {
        title: 'Grant access',
        url: 'https://analytics.google.com/analytics/web/',
      },
    },
    noAccountsOrPropertiesFound: {
      icon: getArrowIcon(
        'The service account must have properties assigned to the account for this check to pass'
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: "Service account doesn't have access to any GA4 properties",
      disabled: false,
      checklistUrl: {
        title: 'Grant access',
        url: 'https://analytics.google.com/analytics/web/',
      },
    },
  },
  Other: {
    unknown: {
      icon: getErrorIcon('Please contant support if an unknown error is seen.'),
      title: CHECKLIST_NAMES.unknown,
      description: 'An unknown error has occurred. Try again or contact support',
      disabled: true,
    },
  },
};

export const getApiChecklistURLs = (parameters: KeyValueMap, apiError: boolean) => {
  const projectId = parameters.serviceAccountKeyId['projectId'];
  return {
    adminApi: {
      title: apiError ? 'Enable Admin API' : 'Details',
      url: `https://console.cloud.google.com/apis/api/analyticsadmin.googleapis.com/metrics?project=${projectId}`,
    },
    dataApi: {
      title: apiError ? 'Enable Data API' : 'Details',
      url: `https://console.cloud.google.com/apis/api/analyticsdata.googleapis.com/metrics?project=${projectId}`,
    },
  };
};

export const getServiceKeyChecklistStatus = (
  parameters: KeyValueMap,
  invalidServiceAccountError: ApiErrorType | undefined,
  missingServiceAccountError: ApiErrorType | undefined
) => {
  const url = `https://console.cloud.google.com/iam-admin/serviceaccounts/details/${parameters.serviceAccountKeyId.clientId}?project=${parameters.serviceAccountKeyId.projectId}`;
  const title = invalidServiceAccountError ? 'Edit service account' : 'Details';
  const checklistUrl = {
    title: title,
    url: url,
  };
  if (invalidServiceAccountError) {
    return { ...CHECKLIST_STATUSES.ServiceKey.invalid, checklistUrl: checklistUrl };
  } else if (missingServiceAccountError) {
    return { ...CHECKLIST_STATUSES.ServiceKey.missing };
  } else {
    return { ...CHECKLIST_STATUSES.ServiceKey.success, checklistUrl: checklistUrl };
  }
};

export const getAdminApiErrorChecklistStatus = (
  isFirstSetup: boolean,
  parameters: KeyValueMap,
  invalidServiceAccountError: ApiErrorType | undefined,
  apiError: ApiErrorType | undefined
): ChecklistRow => {
  const checklistUrl = getApiChecklistURLs(parameters, apiError ? true : false).adminApi;
  if (!invalidServiceAccountError && !apiError)
    return { ...CHECKLIST_STATUSES.AdminApi.success, checklistUrl: checklistUrl };
  if (isFirstSetup && (apiError || !invalidServiceAccountError))
    return { ...CHECKLIST_STATUSES.AdminApi.firstTimeSetup, checklistUrl: checklistUrl };
  if (invalidServiceAccountError) return CHECKLIST_STATUSES.AdminApi.invalidServiceAccount;
  if (apiError) return { ...CHECKLIST_STATUSES.AdminApi.error, checklistUrl: checklistUrl };
  return CHECKLIST_STATUSES.Other.unknown;
};

export const getDataApiErrorChecklistStatus = (
  isFirstSetup: boolean,
  parameters: KeyValueMap,
  invalidServiceAccountError: ApiErrorType | undefined,
  apiError: ApiErrorType | undefined
): ChecklistRow => {
  const checklistUrl = getApiChecklistURLs(parameters, apiError ? true : false).dataApi;
  if (!invalidServiceAccountError && !apiError)
    return { ...CHECKLIST_STATUSES.DataApi.success, checklistUrl: checklistUrl };
  if (isFirstSetup && (apiError || !invalidServiceAccountError))
    return { ...CHECKLIST_STATUSES.DataApi.firstTimeSetup, checklistUrl: checklistUrl };
  if (invalidServiceAccountError) return CHECKLIST_STATUSES.DataApi.invalidServiceAccount;
  if (apiError) return { ...CHECKLIST_STATUSES.DataApi.error, checklistUrl: checklistUrl };
  return CHECKLIST_STATUSES.Other.unknown;
};

export const getGa4PropertyErrorChecklistStatus = (
  isFirstSetup: boolean,
  invalidServiceAccountError: ApiErrorType | undefined,
  adminApiError: ApiErrorType | undefined,
  ga4PropertiesError: ApiErrorType | undefined
): ChecklistRow => {
  if (!invalidServiceAccountError && !adminApiError && !ga4PropertiesError)
    return CHECKLIST_STATUSES.GA4Properties.success;
  if (isFirstSetup) {
    if (adminApiError) return CHECKLIST_STATUSES.GA4Properties.firstTimeSetup;
    if (ga4PropertiesError) return CHECKLIST_STATUSES.GA4Properties.noAccountsOrPropertiesFound;
  }
  if (invalidServiceAccountError) return CHECKLIST_STATUSES.GA4Properties.invalidServiceAccount;
  if (adminApiError) return CHECKLIST_STATUSES.GA4Properties.adminApiError;
  if (ga4PropertiesError) return CHECKLIST_STATUSES.GA4Properties.error;
  return CHECKLIST_STATUSES.Other.unknown;
};
