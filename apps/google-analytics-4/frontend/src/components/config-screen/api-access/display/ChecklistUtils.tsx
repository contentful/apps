import { ApiErrorType } from 'apis/apiTypes';
import {
  CheckCircleIcon,
  ClockIcon,
  ErrorCircleIcon,
  ArrowForwardIcon,
} from '@contentful/f36-icons';
import { KeyValueMap } from 'contentful-management';

const errorIcon = (
  <ErrorCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="negative" />
);
const successIcon = (
  <CheckCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="positive" />
);
const clockIcon = <ClockIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />;
const arrowIcon = (
  <ArrowForwardIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />
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
  };
  Other: {
    unknown: ChecklistRow;
  };
};

export const CHECKLIST_STATUSES: ChecklistStatus = {
  ServiceKey: {
    success: {
      icon: successIcon,
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Success!',
      disabled: false,
    },
    invalid: {
      icon: errorIcon,
      title: CHECKLIST_NAMES.serviceAccount,
      description: 'Invalid service account and service account key',
      disabled: false,
    },
  },
  AdminApi: {
    success: {
      icon: successIcon,
      title: CHECKLIST_NAMES.adminApi,
      description: 'Success!',
      disabled: false,
    },
    firstTimeSetup: {
      icon: arrowIcon,
      title: CHECKLIST_NAMES.adminApi,
      description: 'Please enable the Admin API to run this check',
      disabled: false,
    },
    invalidServiceAccount: {
      icon: clockIcon,
      title: CHECKLIST_NAMES.adminApi,
      description: 'Awaiting a valid service account install',
      disabled: true,
    },
    error: {
      icon: errorIcon,
      title: CHECKLIST_NAMES.adminApi,
      description: 'Failed to connect to the Admin API - did you enable the api?',
      disabled: false,
    },
  },
  DataApi: {
    success: {
      icon: successIcon,
      title: CHECKLIST_NAMES.dataApi,
      description: 'Success!',
      disabled: false,
    },
    firstTimeSetup: {
      icon: arrowIcon,
      title: CHECKLIST_NAMES.dataApi,
      description: 'Please enable the Data API to run this check',
      disabled: false,
    },
    invalidServiceAccount: {
      icon: clockIcon,
      title: CHECKLIST_NAMES.dataApi,
      description: 'Awaiting a valid service account install',
      disabled: true,
    },
    error: {
      icon: errorIcon,
      title: CHECKLIST_NAMES.dataApi,
      description: 'Failed to connect to the Data API - did you enable the api?',
      disabled: false,
    },
  },
  GA4Properties: {
    success: {
      icon: successIcon,
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Success!',
      disabled: false,
    },
    firstTimeSetup: {
      icon: clockIcon,
      title: CHECKLIST_NAMES.ga4Properties,
      description: `Check will run once the ${CHECKLIST_NAMES.adminApi} is enabled`,
      disabled: true,
    },
    invalidServiceAccount: {
      icon: clockIcon,
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Awaiting a valid service account install',
      disabled: true,
    },
    adminApiError: {
      icon: clockIcon,
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'Awaiting the admin api to be enabled',
      disabled: true,
    },
    error: {
      icon: errorIcon,
      title: CHECKLIST_NAMES.ga4Properties,
      description: 'There are no properties listed!',
      disabled: false,
    },
  },
  Other: {
    unknown: {
      icon: errorIcon,
      title: CHECKLIST_NAMES.unknown,
      description: 'Unknown error',
      disabled: true,
    },
  },
};

export const getCheckListURLs = (parameters: KeyValueMap) => {
  const projectId = parameters.serviceAccountKey['project_id'];
  return {
    adminApi: {
      title: 'Enable Admin API',
      url: `https://console.cloud.google.com/apis/api/analyticsadmin.googleapis.com/metrics?project=${projectId}`,
    },
    dataApi: {
      title: 'Enable Data API',
      url: `https://console.cloud.google.com/apis/api/analyticsdata.googleapis.com/metrics?project=${projectId}`,
    },
  };
};

export const getServiceKeyChecklistStatus = (
  invalidServiceAccountError: ApiErrorType | undefined
) => {
  if (!invalidServiceAccountError) return CHECKLIST_STATUSES.ServiceKey.success;
  else return CHECKLIST_STATUSES.ServiceKey.invalid;
};

export const getAdminApiErrorChecklistStatus = (
  isFirstSetup: boolean,
  parameters: KeyValueMap,
  invalidServiceAccountError: ApiErrorType | undefined,
  apiError: ApiErrorType | undefined
): ChecklistRow => {
  const checklistUrl = getCheckListURLs(parameters).adminApi;
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
  const checklistUrl = getCheckListURLs(parameters).dataApi;
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
  if (isFirstSetup && adminApiError) return CHECKLIST_STATUSES.GA4Properties.firstTimeSetup;
  if (invalidServiceAccountError) return CHECKLIST_STATUSES.GA4Properties.invalidServiceAccount;
  if (adminApiError) return CHECKLIST_STATUSES.GA4Properties.adminApiError;
  if (ga4PropertiesError) return CHECKLIST_STATUSES.GA4Properties.error;
  return CHECKLIST_STATUSES.Other.unknown;
};
