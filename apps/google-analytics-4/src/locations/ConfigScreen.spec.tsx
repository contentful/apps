import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const validServiceKeyFile = {
  type: 'service_account',
  project_id: 'PROJECT_ID',
  private_key_id: 'PRIVATE_KEY_ID',
  private_key: '----- PRIVATE_KEY-----',
  client_email: 'example4@PROJECT_ID.iam.gserviceaccount.com',
  client_id: 'CLIENT_ID',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/example4%40PROJECT_ID.iam.gserviceaccount.com',
};

// Helper to mock users clicking "save" -- return result of the callback passed to onConfigure()
const saveAppInstallation = async () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return await mockSdk.app.onConfigure.mock.calls.slice(-1)[0][0]();
};

describe('Config Screen component', () => {
  it('can render the basic form', () => {
    const renderedComponent = render(<ConfigScreen />);
    const { getByText } = renderedComponent;

    expect(getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });

  it('allows the app to be installed with a valid service key file', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);

    const keyFileInputBox = screen.getByLabelText('Google Service Account Key File');

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste(JSON.stringify(validServiceKeyFile));

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    expect(result).toEqual(
      expect.objectContaining({
        parameters: expect.objectContaining({
          serviceAccountKey: expect.objectContaining(validServiceKeyFile),
          serviceAccountKeyId: expect.objectContaining({
            id: validServiceKeyFile.private_key_id,
          }),
        }),
      })
    );
  });
});
