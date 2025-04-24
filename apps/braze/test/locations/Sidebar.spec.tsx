import { render, fireEvent, cleanup, waitFor } from '@testing-library/react'; // Import waitFor
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SIDEBAR_BUTTON_TEXT, DIALOG_TITLE } from '../../src/utils';
import { mockSdk, mockCma } from '../mocks';
import Sidebar from '../../src/locations/Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
  });

  afterEach(cleanup);

  it('Component text exists', () => {
    const { getByText } = render(<Sidebar />);
    expect(getByText(SIDEBAR_BUTTON_TEXT)).toBeTruthy();
  });

  it('Button opens a dialog initially', async () => {
    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        title: 'Title',
      },
      width: 'large',
    });
  });

  it('Button opens dialog again if parameters are returned', async () => {
    const result = { step: 'codeBlocks', otherParam: 'value' };
    vi.mocked(mockSdk.dialogs.openCurrentApp).mockResolvedValueOnce(result);

    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        title: 'Title',
      },
      width: 'large',
    });

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(2);
    });

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenNthCalledWith(2, {
      title: DIALOG_TITLE,
      parameters: result,
      width: 'fullWidth',
    });
  });

  it('Button does not open dialog again if step is close', async () => {
    const result = { step: 'close' };
    vi.mocked(mockSdk.dialogs.openCurrentApp).mockResolvedValueOnce(result);

    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_BUTTON_TEXT);
    await fireEvent.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        title: 'Title',
      },
      width: 'large',
    });

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    });
  });
});
