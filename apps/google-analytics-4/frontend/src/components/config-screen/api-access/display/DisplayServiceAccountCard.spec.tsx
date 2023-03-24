import { act, render, screen } from '@testing-library/react';
import {
  mockSdk,
  mockCma,
  validServiceKeyFile,
  validServiceKeyId,
} from '../../../../../test/mocks';
import DisplayServiceAccountCard from 'components/config-screen/api-access/display/DisplayServiceAccountCard';
import { config } from '../../../../../src/config';

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
      serviceAccountKey: validServiceKeyFile,
      serviceAccountKeyId: validServiceKeyId,
    });
  });

  it('is the active happy path', async () => {
    await act(async () => {
      render(
        <DisplayServiceAccountCard
          serviceAccountKeyId={validServiceKeyId}
          serviceAccountKey={validServiceKeyFile}
          parameters={{}}
          onInEditModeChange={() => {}}
          onAccountSummariesChange={() => {}}
          isAppInstalled={true}
          onHasServiceCheckErrorsChange={() => {}}
        />
      );
    });

    await screen.findByText('Google Service Account Details');
    await screen.findByText('Active');
  });
});
