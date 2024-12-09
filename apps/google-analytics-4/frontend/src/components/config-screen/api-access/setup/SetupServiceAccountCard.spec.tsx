import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupServiceAccountCard from 'components/config-screen/api-access/setup/SetupServiceAccountCard';
import { mockSdk, mockCma, validServiceKeyFile } from '../../../../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Setup Google Service Account Details page', () => {
  it('renders account card with no input', () => {
    render(
      <SetupServiceAccountCard
        parameters={{}}
        mergeSdkParameters={() => {}}
        onInEditModeChange={() => {}}
        isInEditMode={false}
        onKeyFileUpdate={() => {}}
      />
    );

    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
    expect(screen.getByText('Paste the service account key file (JSON) above')).toBeInTheDocument();
    expect(screen.getByLabelText(/Service Account Key/).getAttribute('aria-invalid')).toBeNull();
  });

  it('renders an error state when invalid input', async () => {
    const user = userEvent.setup();
    render(
      <SetupServiceAccountCard
        parameters={{}}
        mergeSdkParameters={() => {}}
        onInEditModeChange={() => {}}
        isInEditMode={false}
        onKeyFileUpdate={() => {}}
      />
    );

    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste(JSON.stringify({ foo: 'bar' }));

    expect(screen.getByLabelText(/Service Account Key/).getAttribute('aria-invalid')).toEqual(
      'true'
    );
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });

  it('renders a success state when valid input', async () => {
    const user = userEvent.setup();
    render(
      <SetupServiceAccountCard
        parameters={{}}
        mergeSdkParameters={() => {}}
        onInEditModeChange={() => {}}
        isInEditMode={false}
        onKeyFileUpdate={() => {}}
      />
    );

    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste(JSON.stringify(validServiceKeyFile));

    expect(screen.getByLabelText(/Service Account Key/).getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByText('Service account key file is valid JSON')).toBeInTheDocument();
  });
});
