import { act, render, screen } from '@testing-library/react';
import { mockSdk, mockCma, validServiceKeyId } from '../../../../../test/mocks';
import DisplayServiceAccountCard from 'components/config-screen/api-access/display/DisplayServiceAccountCard';
import { config } from 'config';

const apiRoot = config.backendApiUrl;

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

describe('Installed Service Account Card', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKeyId: validServiceKeyId,
    });
  });

  it('is the active happy path', async () => {
    await act(async () => {
      render(
        <DisplayServiceAccountCard
          isSavingPrivateKeyFile={false}
          serviceAccountKeyId={validServiceKeyId}
          parameters={{}}
          onInEditModeChange={() => {}}
          onAccountSummariesChange={() => {}}
          isAppInstalled={true}
          onHasServiceCheckErrorsChange={() => {}}
          onIsApiAccessLoading={() => {}}
        />
      );
    });

    await screen.findByText('Google Service Account Details');
    await screen.findByText('Successfully configured');
  });
});
