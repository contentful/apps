import { act, render, screen } from '@testing-library/react';
import SetupServiceAccountCard from 'components/config-screen/api-access/service-account/SetupServiceAccountCard';
import { validServiceKeyFile } from "../../../../../test/mocks";

describe('Setup Google Service Account Details page', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(<SetupServiceAccountCard
        isValid={false}
        errorMessage="error"
        isRequired={true}
        serviceAccountKeyFile={JSON.stringify(validServiceKeyFile)}
        onKeyFileChange={() => { }}
        onCancelGoogleAccountDetails={() => { }}
        isInEditMode={false}
      />);
    });

    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });
});