import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCma, mockSdk, validServiceKeyFile } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

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

  it('prevents the app from being installed with an valid service key file', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);

    const keyFileInputBox = screen.getByLabelText('Google Service Account Key File');

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste('{ "foo": "bar" }');

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    // false result prevents parameters save
    expect(result).toEqual(false);
  });
});
