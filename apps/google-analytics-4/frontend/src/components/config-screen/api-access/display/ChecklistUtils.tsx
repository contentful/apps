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
      <ErrorCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="negative" />
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
      <ArrowForwardIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />
    </Flex>
  </Tooltip>
);

const CHECKLIST_NAMES = {
  serviceAccount: 'Service account',
  adminApi: 'Admin API',
  dataApi: 'Data API',
  ga4Properties: 'Property access',
  unknown: 'Unknown',
};

export type ChecklistURL = {
  title: string;
  url: string;
  external?: boolean;
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
    firstTimeSetupNotEnabled: ChecklistRow;
    firstTimeSetup: ChecklistRow;
    invalidServiceAccount: ChecklistRow;
    adminApiError: ChecklistRow;
    error: ChecklistRow;
  };
  Other: {
    unknown: ChecklistRow;
  };
};

export const CHECKLIST_STATUSES: ChecklistStatus = {
  ServiceKey: {
    success: {
      icon: getSuccessIcon(''),
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Service account key is valid',
      disabled: false,
    },
    invalid: {
      icon: getErrorIcon(
        `We couldn't connect to Google Analytics APIs using the service account key provided. Try re-installing your current service account key or create and install a new key`
      ),
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Service account key is not valid',
      disabled: false,
    },
    missing: {
      icon: getErrorIcon(
        "For technical reasons we were unable to retrieve the service account key that's stored for this app. If the problem persists, try reinstalling the service account key or contact support."
      ),
      title: CHECKLIST_NAMES.serviceAccount,
      description:
        'Unable to retrieve your stored service account key. Re-install it if the problem persists',
      disabled: false,
    },
  },
  AdminApi: {
    success: {
      icon: getSuccessIcon(''),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Google Analytics Admin API is enabled',
      disabled: false,
    },
    firstTimeSetup: {
      icon: getArrowIcon(
        'The Google Analytics Admin API allows Contentful to fetch the list of properties your service account has access to. Please enable this API inside your Google Cloud project to continue.'
      ),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Google Analytics Admin API is not yet enabled',
      disabled: false,
    },
    invalidServiceAccount: {
      icon: getClockIcon(
        'This check will not run until a valid service account key has been provided'
      ),
      title: CHECKLIST_NAMES.adminApi,
      description: `Provide a valid service account key to run this check`,
      disabled: true,
    },
    error: {
      icon: getErrorIcon(
        'The Google Analytics Admin API allows Contentful to fetch the list of properties your service account has access to. Please enable this API inside your Google Cloud project.'
      ),
      title: CHECKLIST_NAMES.adminApi,
      description: 'Google Analytics Admin API is not enabled',
      disabled: false,
    },
  },
  DataApi: {
    success: {
      icon: getSuccessIcon(''),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Google Analytics Data API is enabled',
      disabled: false,
    },
    firstTimeSetup: {
      icon: getArrowIcon(
        'The Google Analytics Data API allows Contentful to fetch analytics data from the property you specify. Please enable this API inside your Google Cloud project to continue.'
      ),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Google Analytics Data API is not yet enabled',
      disabled: false,
    },
    invalidServiceAccount: {
      icon: getClockIcon(
        'This check will not run until a valid service account key has been provided'
      ),
      title: CHECKLIST_NAMES.dataApi,
      description: `Provide a valid service account key to run this check`,
      disabled: true,
    },
    error: {
      icon: getErrorIcon(
        'The Google Analytics Data API allows Contentful to fetch analytics data from the property you specify. Please enable this API inside your Google Cloud project.'
      ),
      title: CHECKLIST_NAMES.dataApi,
      description: 'Google Analytics Data API is not enabled',
      disabled: false,
    },
  },
  GA4Properties: {
    success: {
      icon: getSuccessIcon(''),
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Service account has "viewer" access',
      disabled: false,
      checklistUrl: {
        title: 'Details',
        url: 'https://analytics.google.com/analytics/web/',
      },
    },
    firstTimeSetup: {
      icon: getArrowIcon(
        `You need to grant viewer access to your service account in a Google Analytics 4 property.`
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: "Service account doesn't have access to any GA4 properties",
      disabled: false,
      checklistUrl: {
        title: 'Grant access',
        url: 'https://analytics.google.com/analytics/web/',
      },
    },
    firstTimeSetupNotEnabled: {
      icon: getClockIcon(
        `You'll need to grant viewer access to your service account in a Google Analytics 4 property. This check will run once the ${CHECKLIST_NAMES.adminApi} has been enabled.`
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: `Enable Google Analytics Admin API to run this check`,
      disabled: true,
    },
    invalidServiceAccount: {
      icon: getClockIcon(
        'This check will not run until a valid service account key has been provided'
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: `Provide a valid service account key to run this check`,
      disabled: true,
    },
    adminApiError: {
      icon: getClockIcon(
        'This check will not run until the Google Analytics Admin API has been enabled'
      ),
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Enable Google Analytics Admin API to run this check',
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
  },
  Other: {
    unknown: {
      icon: getErrorIcon(
        'Something went wrong. Please try again, or get in touch with support of the problem persists'
      ),
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
  const title = invalidServiceAccountError ? 'Manage service account' : 'Details';
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
  console.log('isFirstSetup', isFirstSetup);
  console.log('invalidServiceAccountError', invalidServiceAccountError);
  console.log('adminApiError', adminApiError);
  console.log('ga4PropertiesError', ga4PropertiesError);
  if (!invalidServiceAccountError && !adminApiError && !ga4PropertiesError)
    return CHECKLIST_STATUSES.GA4Properties.success;
  if (isFirstSetup && adminApiError)
    return CHECKLIST_STATUSES.GA4Properties.firstTimeSetupNotEnabled;
  if (isFirstSetup && ga4PropertiesError) return CHECKLIST_STATUSES.GA4Properties.firstTimeSetup;
  if (adminApiError) return CHECKLIST_STATUSES.GA4Properties.adminApiError;
  if (invalidServiceAccountError) return CHECKLIST_STATUSES.GA4Properties.invalidServiceAccount;
  if (ga4PropertiesError) return CHECKLIST_STATUSES.GA4Properties.error;
  return CHECKLIST_STATUSES.Other.unknown;
};
