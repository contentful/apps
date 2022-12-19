import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCma, mockSdk, validServiceKeyFile } from '../../test/mocks';

import type { ServiceAccountKey, ServiceAccountKeyId } from '../types';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const validServiceKeyId: ServiceAccountKeyId = {
  id: validServiceKeyFile.private_key_id,
  clientId: validServiceKeyFile.client_id,
  clientEmail: validServiceKeyFile.client_id,
  projectId: validServiceKeyFile.project_id,
};

// Helper to mock users clicking "save" -- return result of the callback passed to onConfigure()
const saveAppInstallation = async () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return await mockSdk.app.onConfigure.mock.calls.slice(-1)[0][0]();
};

describe('Config Screen component (not installed)', () => {
  it('can render the basic form', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });

  it('allows the app to be installed with a valid service key file', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ConfigScreen />);
    });

    const keyFileInputBox = screen.getByLabelText(/Service Account Key File/i);

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

  it('prevents the app from being installed with invalid service key file', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ConfigScreen />);
    });

    const keyFileInputBox = screen.getByLabelText(/Service Account Key File/i);

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

  it('prevents the app from being installed if no service key file is provided', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    // false result prevents parameters save
    expect(result).toEqual(false);
  });
});

describe('Config Screen component (installed)', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKey: validServiceKeyFile,
      serviceAccountKeyId: validServiceKeyId,
    });
  });

  it('can render the basic form', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });

  it('overrides the saved values if a new key file is provided', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ConfigScreen />);
    });

    const fieldExpander = screen.getByTestId('keyFileFieldExpander');

    await user.click(fieldExpander);
    const keyFileInputBox = screen.getByLabelText(/Service Account Key File/i);
    await waitFor(() => user.click(keyFileInputBox));

    const newServiceKeyFile: ServiceAccountKey = {
      ...validServiceKeyFile,
      private_key_id: 'new_private_key_id',
    };
    await user.paste(JSON.stringify(newServiceKeyFile));

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    expect(result).toEqual(
      expect.objectContaining({
        parameters: expect.objectContaining({
          serviceAccountKey: expect.objectContaining(newServiceKeyFile),
          serviceAccountKeyId: expect.objectContaining({
            id: 'new_private_key_id',
          }),
        }),
      })
    );
  });

  it('does not require key file on save', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    // result should reflect the same parameters that were loaded, since no change
    // was made by the user
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
