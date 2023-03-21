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
        />
      );
    });

    await screen.findByText('Service Account Check');
    await screen.findByText('Admin Api Check');
    await screen.findByText('Data Api Check');
    await screen.findByText('Google Analytics 4 Accounts and Properties Check');
    await screen.findByText('Valid service account and service account key.');
    await screen.findByText('Admin API successful connected.');
    await screen.findByText('Data API successful connected.');
    await screen.findByText('Google Analytics 4 accounts and properties found successfully.');
  });

  it('invalid service account key', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={invalidServiceAccountError}
          adminApiError={undefined}
          dataApiError={undefined}
          ga4PropertiesError={undefined}
        />
      );
    });

    await screen.findByText('Invalid Service Account Error Message.');
  });

  it('admin api not enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={adminApiError}
          dataApiError={undefined}
          ga4PropertiesError={undefined}
        />
      );
    });

    await screen.findByText('Admin API Error Message.');
  });

  it('data api not enabled', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={undefined}
          dataApiError={dataApiError}
          ga4PropertiesError={undefined}
        />
      );
    });

    await screen.findByText('Data API Error Message.');
  });

  it('has no found GA4 Accounrs or Properties', async () => {
    await act(async () => {
      render(
        <ServiceAccountChecklist
          invalidServiceAccountError={undefined}
          adminApiError={undefined}
          dataApiError={undefined}
          ga4PropertiesError={ga4PropertiesError}
        />
      );
    });

    await screen.findByText('No GA4 Properties Error Message.');
  });
});
