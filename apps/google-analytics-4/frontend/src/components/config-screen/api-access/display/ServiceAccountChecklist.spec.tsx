import { act, render, screen } from '@testing-library/react';
import ServiceAccountChecklist from 'components/config-screen/api-access/display/ServiceAccountChecklist';
import { ERROR_TYPE_MAP } from 'apis/apiTypes';

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

describe('Service Account Checklist', () => {
  it('is the active happy path', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={undefined}
          dataApiError={undefined}
          ga4PropertiesError={undefined}
          parameters={{ propertyId: '123' }}
        />
      );
    });

    await screen.findByText('Service Account');
    await screen.findByText('Admin api');
    await screen.findByText('Data api');
    await screen.findByText('GA4 Account Properties');
    await screen.findAllByText(/Success!/);
  });

  it('installed with service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={invalidServiceAccountError}
          adminApiError={undefined}
          dataApiError={undefined}
          ga4PropertiesError={undefined}
          parameters={{ propertyId: '123' }}
        />
      );
    });

    await screen.findByText(/Invalid service account and service account key/);
    await screen.findAllByText(/Check will run once a valid key service is installed/);
    await screen.findByText(
      /This check will run with a valid service key and admin api connection/
    );
  });

  it('invalid service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={invalidServiceAccountError}
          adminApiError={undefined}
          dataApiError={undefined}
          ga4PropertiesError={undefined}
          parameters={{}}
        />
      );
    });

    await screen.findAllByText(/Awaiting a valid service account install/);
  });

  it('invalid service account key even when apis are enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={invalidServiceAccountError}
          adminApiError={adminApiError}
          dataApiError={dataApiError}
          ga4PropertiesError={undefined}
          parameters={{}}
        />
      );
    });

    await screen.findAllByText(/Awaiting a valid service account install/);
  });

  it('does not have the admin api enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={adminApiError}
          dataApiError={undefined}
          ga4PropertiesError={undefined}
          parameters={{}}
        />
      );
    });

    await screen.findByText(/Check will run once the Admin api is enabled/);
  });

  it('does not have the data api enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={undefined}
          dataApiError={dataApiError}
          ga4PropertiesError={undefined}
          parameters={{}}
        />
      );
    });

    await screen.findByText(/Please enable the Data api to run this check/);
  });

  it('has no found GA4 Accounts or Properties', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={undefined}
          dataApiError={undefined}
          ga4PropertiesError={ga4PropertiesError}
          parameters={{ propertyId: '123' }}
        />
      );
    });

    await screen.findByText(/There are no properties listed!/);
  });
});
