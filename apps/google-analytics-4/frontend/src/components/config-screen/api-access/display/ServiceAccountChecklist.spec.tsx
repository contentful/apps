import { act, render, screen } from '@testing-library/react';
import ServiceAccountChecklist from 'components/config-screen/api-access/display/ServiceAccountChecklist';
import { ApiErrorType, ERROR_TYPE_MAP } from 'apis/apiTypes';
import {
  getServiceKeyChecklistStatus,
  getAdminApiErrorChecklistStatus,
  getDataApiErrorChecklistStatus,
  getGa4PropertyErrorChecklistStatus,
} from 'components/config-screen/api-access/display/ChecklistUtils';

const invalidServiceAccountError = {
  errorType: ERROR_TYPE_MAP.invalidServiceAccount,
  message: 'Invalid Service Account Error Message.',
  status: 500,
};

const invalidServiceAccountKeyError = {
  errorType: ERROR_TYPE_MAP.invalidServiceAccountKey,
  message: 'Invalid Service Account Key Error Message.',
  status: 500,
};

const missingServiceAccountKeyFileError = {
  errorType: ERROR_TYPE_MAP.missingServiceAccountKeyFile,
  message: 'Missing Service Account Key File Error Message.',
  status: 500,
};

const adminApiError = {
  errorType: ERROR_TYPE_MAP.disabledAdminApi,
  message: 'Admin API Error Message.',
  status: 500,
};

const dataApiError = {
  errorType: ERROR_TYPE_MAP.disabledDataApi,
  message: 'Data API Error Message.',
  status: 500,
};

const ga4PropertiesError = {
  errorType: ERROR_TYPE_MAP.noAccountsOrPropertiesFound,
  message: 'No GA4 Properties Error Message.',
  status: 500,
};

const parameters = {
  propertyId: '1234',
  serviceAccountKey: {
    project_id: 'abc',
  },
  serviceAccountKeyId: {
    clientEmail: 'test@ga4-test-377818.iam.gserviceaccount.com',
    clientId: '1234',
    id: 'abc',
    projectId: 'ga4-test',
  },
};

describe('Service Account Checklist', () => {
  it('is the active happy path', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, undefined, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(false, parameters, undefined, undefined),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(false, parameters, undefined, undefined),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(false, undefined, undefined, undefined),
          }}
        />
      );
    });

    await screen.findByText('Service account');
    await screen.findByText('Admin API');
    await screen.findByText('Data API');
    await screen.findByText('Property access');
    // Service account message
    await screen.findByText(/Service account key is valid/);
    // Message and action for other three checks
    await screen.findAllByText(/enabled/);
    await screen.findAllByText(/Details/);
  });

  it('installed with invalid service account', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, {} as ApiErrorType, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              false,
              parameters,
              invalidServiceAccountError,
              undefined
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              false,
              parameters,
              invalidServiceAccountError,
              undefined
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              false,
              invalidServiceAccountError,
              undefined,
              undefined
            ),
          }}
        />
      );
    });

    // Service account message and action
    await screen.findByText(/Service account key is not valid/);
    await screen.findByText(/Manage service account/);
    // Message for other three checks
    await screen.findAllByText(/Provide a valid service account key to run this check/);
  });

  it('installed with invalid service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, {} as ApiErrorType, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              false,
              parameters,
              invalidServiceAccountKeyError,
              undefined
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              false,
              parameters,
              invalidServiceAccountKeyError,
              undefined
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              false,
              invalidServiceAccountKeyError,
              undefined,
              undefined
            ),
          }}
        />
      );
    });

    // Service account message and action
    await screen.findByText(/Service account key is not valid/);
    await screen.findByText(/Manage service account/);
    // Message for other three checks
    await screen.findAllByText(/Provide a valid service account key to run this check/);
  });

  it('missing service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, undefined, {} as ApiErrorType),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              false,
              parameters,
              missingServiceAccountKeyFileError,
              undefined
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              false,
              parameters,
              missingServiceAccountKeyFileError,
              undefined
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              false,
              missingServiceAccountKeyFileError,
              undefined,
              undefined
            ),
          }}
        />
      );
    });

    // Service account message
    await screen.findByText(/Unable to retrieve your stored service account key/);
    // Message for other three checks
    await screen.findAllByText(/Provide a valid service account key to run this check/);
  });

  it('first time install with invalid service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, {} as ApiErrorType, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              true,
              parameters,
              invalidServiceAccountError,
              undefined
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              true,
              parameters,
              invalidServiceAccountError,
              undefined
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              true,
              invalidServiceAccountError,
              undefined,
              undefined
            ),
          }}
        />
      );
    });

    // Service account message and action
    await screen.findByText(/Service account key is not valid/);
    await screen.findByText(/Manage service account/);
    // Message for other three checks
    await screen.findAllByText(/Provide a valid service account key to run this check/);
  });

  it('invalid service account when admin and data apis are not enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, {} as ApiErrorType, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              true,
              parameters,
              invalidServiceAccountError,
              adminApiError
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              true,
              parameters,
              invalidServiceAccountError,
              dataApiError
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              true,
              invalidServiceAccountError,
              adminApiError,
              undefined
            ),
          }}
        />
      );
    });

    // Service account message and action
    await screen.findByText(/Service account key is not valid/);
    await screen.findByText(/Manage service account/);
    // API messages and actions
    await screen.findByText(/Analytics Admin API is not yet enabled/);
    await screen.findByText(/Enable Admin API/);
    await screen.findByText(/Analytics Data API is not yet enabled/);
    await screen.findByText(/Enable Data API/);
    // Property message
    await screen.findByText(/Enable Google Analytics Admin API to run this check/);
  });

  it('does not have the admin api enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, undefined, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(true, parameters, undefined, adminApiError),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(true, parameters, undefined, undefined),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(true, undefined, adminApiError, undefined),
          }}
        />
      );
    });

    // Admin API message and action
    await screen.findByText(/Analytics Admin API is not yet enabled/);
    await screen.findByText(/Enable Admin API/);
  });

  it('does not have the data api enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, undefined, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(true, parameters, undefined, undefined),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(true, parameters, undefined, dataApiError),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              true,
              invalidServiceAccountError,
              undefined,
              undefined
            ),
          }}
        />
      );
    });

    // Data API message and action
    await screen.findByText(/Analytics Data API is not yet enabled/);
    await screen.findByText(/Enable Data API/);
  });

  it('has no found GA4 Accounts or Properties', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(parameters, undefined, undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(true, parameters, undefined, undefined),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(true, parameters, undefined, undefined),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(true, undefined, undefined, ga4PropertiesError),
          }}
        />
      );
    });

    // Properties message and action
    await screen.findByText(/Service account doesn't have access to a Google Analytics 4 property/);
    await screen.findByText(/Grant access/);
  });
});
