import { act, render, screen } from '@testing-library/react';
import ServiceAccountChecklist from 'components/config-screen/api-access/display/ServiceAccountChecklist';
import { ERROR_TYPE_MAP } from 'apis/apiTypes';
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
};

describe('Service Account Checklist', () => {
  it('is the active happy path', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(undefined),
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

    await screen.findByText('Service Account');
    screen.findByText('Admin api');
    screen.findByText('Data api');
    screen.findByText('GA4 Account Properties');
    screen.findAllByText(/Success!/);
  });

  it('installed with invalid service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(invalidServiceAccountError),
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

    await screen.findByText(/Invalid service account and service account key/);
    screen.findAllByText(/Awaiting a valid service account install/);
  });

  it('first time install with invalid service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(invalidServiceAccountError),
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

    await screen.findAllByText(/Awaiting a valid service account install/);
  });

  it('invalid service account key even when apis are enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(invalidServiceAccountError),
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

    await screen.findAllByText(/Invalid service account and service account key/);
    screen.findAllByText(/Please enable the Admin API to run this check/);
    screen.findAllByText(/Please enable the Data API to run this check/);
    screen.findAllByText(/Check will run once the Admin API is enabled/);
  });

  it('does not have the admin api enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              true,
              parameters,
              undefined,
              adminApiError
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              true,
              parameters,
              undefined,
              undefined
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              true,
              undefined,
              adminApiError,
              undefined
            ),
          }}
        />
      );
    });

    await screen.findByText(/Check will run once the Admin API is enabled/);
  });

  it('does not have the data api enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              true,
              parameters,
              undefined,
              undefined
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              true,
              parameters,
              undefined,
              dataApiError
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

    await screen.findByText(/Please enable the Data API to run this check/);
  });

  it('has no found GA4 Accounts or Properties', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          serviceAccountCheck={{
            ...getServiceKeyChecklistStatus(undefined),
          }}
          adminApiCheck={{
            ...getAdminApiErrorChecklistStatus(
              true,
              parameters,
              undefined,
              undefined
            ),
          }}
          dataApiCheck={{
            ...getDataApiErrorChecklistStatus(
              true,
              parameters,
              undefined,
              undefined
            ),
          }}
          ga4PropertiesCheck={{
            ...getGa4PropertyErrorChecklistStatus(
              true,
              undefined,
              undefined,
              ga4PropertiesError
            ),
          }}
        />
      );
    });

    await screen.findByText(/There are no properties listed!/);
  });
});
