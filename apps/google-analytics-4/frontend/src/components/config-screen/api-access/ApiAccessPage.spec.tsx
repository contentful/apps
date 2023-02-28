import { act, render, screen } from '@testing-library/react';
import ApiAccessPage from "./ApiAccessPage";

describe('Config Screen component (not installed)', () => {
  it('can render the about section', async () => {
    await act(async () => {
      // render(<ApiAccessPage
      //   onEditGoogleAccountDetails={() => { }}
      //   onCancelGoogleAccountDetails={() => { }}
      //   onSaveGoogleAccountDetails={() => { }}
      //   onAccountSummariesFetch={() => { }}
      //   installationErrors={[]}
      //   onInstallationErrors={() => { }}

      // />);
    });

    expect(screen.getByText('API Access')).toBeInTheDocument();
  });
});