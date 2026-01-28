import { render, fireEvent, cleanup, waitFor, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  GENERATE_DIALOG_TITLE,
  CREATE_DIALOG_TITLE,
  SIDEBAR_GENERATE_BUTTON_TEXT,
  SIDEBAR_CREATE_BUTTON_TEXT,
  SIDEBAR_CONNECTED_ENTRIES_BUTTON_TEXT,
} from '../../src/utils';
import { mockSdk } from '../mocks';
import Sidebar from '../../src/locations/Sidebar';
import { useSDK } from '@contentful/react-apps-toolkit';
import React from 'react';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(() => mockSdk),
  useAutoResizer: () => {},
}));

mockSdk.entry.fields['fieldA'] = {
  name: 'Field A',
};

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.cma.appActionCall.createWithResponse.mockResolvedValue({
      response: {
        body: JSON.stringify({
          contentBlocks: [
            {
              fieldId: 'fieldA',
              locale: 'en-US',
              contentBlockId: 'contentBlockA',
              contentBlockName: 'Content Block A',
            },
          ],
        }),
      },
    });
    (useSDK as any).mockReturnValue(mockSdk);
  });

  afterEach(cleanup);

  it('Generate button text exists', () => {
    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_GENERATE_BUTTON_TEXT);

    expect(button).toBeTruthy();
    expect(button.innerText).toBe(SIDEBAR_GENERATE_BUTTON_TEXT);
  });

  it('Create button text exists', () => {
    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_CREATE_BUTTON_TEXT);

    expect(button).toBeTruthy();
    expect(button.innerText).toBe(SIDEBAR_CREATE_BUTTON_TEXT);
  });

  it('Generate button opens a dialog initially', async () => {
    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_GENERATE_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: GENERATE_DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        mode: 'generate',
        title: 'Title',
      },
      width: 'large',
    });
  });

  it('Generate button opens dialog again if parameters are returned', async () => {
    const result = { step: 'codeBlocks', otherParam: 'value' };
    vi.mocked(mockSdk.dialogs.openCurrentApp).mockResolvedValueOnce(result);

    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_GENERATE_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: GENERATE_DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        mode: 'generate',
        contentTypeId: mockSdk.ids.contentType,
        title: 'Title',
      },
      width: 'large',
    });

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(2);
    });

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenNthCalledWith(2, {
      title: GENERATE_DIALOG_TITLE,
      parameters: { ...result, mode: 'generate' },
      width: 'fullWidth',
    });
  });

  it('Generate button does not open dialog again if step is close', async () => {
    const result = { step: 'close' };
    vi.mocked(mockSdk.dialogs.openCurrentApp).mockResolvedValueOnce(result);

    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_GENERATE_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: GENERATE_DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        mode: 'generate',
        title: 'Title',
      },
      width: 'large',
    });

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    });
  });

  it('Create button opens a dialog', async () => {
    vi.mocked(mockSdk.dialogs.openCurrentApp).mockResolvedValueOnce({ step: 'close' });
    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_CREATE_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: CREATE_DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        mode: 'create',
        title: 'Title',
      },
      width: 'large',
    });
  });

  it('renders the "Connected Content Block entries" section when connectedFields are present', async () => {
    const { getByText } = render(<Sidebar />);
    await screen.findByText('Connected Content Block entries', { exact: false });
    expect(getByText('Field A (en-US)')).toBeTruthy();
    expect(getByText('Content Block A')).toBeTruthy();
  });

  it('renders the Connected Entries button and triggers navigation when clicked', async () => {
    const { getByText } = render(<Sidebar />);
    await screen.findByText(SIDEBAR_CONNECTED_ENTRIES_BUTTON_TEXT, { exact: false });
    const button = getByText(SIDEBAR_CONNECTED_ENTRIES_BUTTON_TEXT);

    expect(button).toBeTruthy();

    fireEvent.click(button);

    expect(mockSdk.navigator.openCurrentAppPage).toHaveBeenCalledTimes(1);
  });

  describe('Configuration validation', () => {
    it('shows warning when all config values are empty', () => {
      const sdkWithEmptyConfig = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            contentfulApiKey: '',
            brazeApiKey: '',
            brazeEndpoint: '',
            brazeConnectedFields: '{}',
          },
        },
      };
      (useSDK as any).mockReturnValue(sdkWithEmptyConfig);

      const { getByText } = render(<Sidebar />);
      expect(getByText('Update your app configuration')).toBeTruthy();
    });

    it('shows warning when contentfulApiKey is missing', () => {
      const sdkWithMissingContentfulKey = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            ...mockSdk.parameters.installation,
            contentfulApiKey: '',
          },
        },
      };
      (useSDK as any).mockReturnValue(sdkWithMissingContentfulKey);

      const { getByText } = render(<Sidebar />);
      expect(getByText('Update your app configuration')).toBeTruthy();
    });

    it('shows warning when brazeApiKey is missing', () => {
      const sdkWithMissingBrazeKey = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            ...mockSdk.parameters.installation,
            brazeApiKey: '',
          },
        },
      };
      (useSDK as any).mockReturnValue(sdkWithMissingBrazeKey);

      const { getByText } = render(<Sidebar />);
      expect(getByText('Update your app configuration')).toBeTruthy();
    });

    it('shows warning when brazeEndpoint is missing', () => {
      const sdkWithMissingEndpoint = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            ...mockSdk.parameters.installation,
            brazeEndpoint: '',
          },
        },
      };
      (useSDK as any).mockReturnValue(sdkWithMissingEndpoint);

      const { getByText } = render(<Sidebar />);
      expect(getByText('Update your app configuration')).toBeTruthy();
    });

    it('disables buttons when config is incomplete', () => {
      const sdkWithIncompleteConfig = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            contentfulApiKey: '',
            brazeApiKey: 'test-braze-key',
            brazeEndpoint: 'test-endpoint',
            brazeConnectedFields: '{}',
          },
        },
      };
      (useSDK as any).mockReturnValue(sdkWithIncompleteConfig);

      const { getByText, getByRole } = render(<Sidebar />);
      const generateButton = getByRole('button', {
        name: SIDEBAR_GENERATE_BUTTON_TEXT,
      }) as HTMLButtonElement;
      const createButton = getByRole('button', {
        name: SIDEBAR_CREATE_BUTTON_TEXT,
      }) as HTMLButtonElement;

      expect(generateButton?.disabled).toBe(true);
      expect(createButton?.disabled).toBe(true);
    });
  });
});
