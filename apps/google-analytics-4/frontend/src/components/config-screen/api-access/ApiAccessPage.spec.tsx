import { act, render, screen } from '@testing-library/react';
import ApiAccessPage from "./ApiAccessPage";

describe('Config Screen component (not installed)', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(<ApiAccessPage
        isRequired={true}
        isValid={true}
        errorMessage={"error"}
        currentServiceAccountKeyId={null}
        currentServiceAccountKey={null}
        serviceAccountKeyFile={"file"}
        onKeyFileChange={() => { }}
        isInEditMode={false}
        onEditGoogleAccountDetails={() => { }}
        onCancelGoogleAccountDetails={() => { }}
      />);
    });

    expect(screen.getByText('API Access')).toBeInTheDocument();
  });
});