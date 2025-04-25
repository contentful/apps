import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  DIALOG_TITLE,
  SIDEBAR_GENERATE_BUTTON_TEXT,
  SIDEBAR_CREATE_BUTTON_TEXT,
} from '../../src/utils';
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
    vi.clearAllMocks();
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
      title: DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
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

  it('Generate button does not open dialog again if step is close', async () => {
    const result = { step: 'close' };
    vi.mocked(mockSdk.dialogs.openCurrentApp).mockResolvedValueOnce(result);

    const { getByText } = render(<Sidebar />);
    const button = getByText(SIDEBAR_GENERATE_BUTTON_TEXT);
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

  it('Create button opens a dialog', () => {
    const { getByText } = render(<Sidebar />);
    getByText(SIDEBAR_CREATE_BUTTON_TEXT).click();

    expect(mockSdk.dialogs.openCurrentApp).toBeCalledWith({
      title: DIALOG_TITLE,
      parameters: {
        entryId: mockSdk.ids.entry,
        contentTypeId: mockSdk.ids.contentType,
        title: 'Title',
      },
      width: 'large',
    });
  });
});
