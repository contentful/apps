import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSdk } from './mocks';
import Sidebar from '../src/locations/Sidebar';
import userEvent from '@testing-library/user-event';
import { APP_NAME } from '../src/utils/consts';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display text and button', () => {
    render(<Sidebar />);

    expect(screen.getByText('Populate content across similar locales')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: APP_NAME })).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const button = screen.getByRole('button', { name: APP_NAME });

    await user.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledOnce();
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith(
      expect.objectContaining({
        title: APP_NAME,
        width: 'fullWidth',
        parameters: {
          entryId: mockSdk.entry.getSys().id,
          contentTypeId: mockSdk.contentType.sys.id,
        },
      })
    );
  });
});
