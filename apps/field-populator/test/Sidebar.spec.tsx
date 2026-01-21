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
  });

  it('should copy field values from source locale to target locales', async () => {
    const user = userEvent.setup();
    const titleGetValue = vi.fn().mockReturnValue('Hello');
    const titleSetValue = vi.fn();
    const bodyGetValue = vi.fn().mockReturnValue('World');
    const bodySetValue = vi.fn();

    mockSdk.entry = {
      fields: {
        title: {
          getValue: titleGetValue,
          setValue: titleSetValue,
        },
        body: {
          getValue: bodyGetValue,
          setValue: bodySetValue,
        },
      },
    };

    mockSdk.dialogs.openCurrentApp.mockResolvedValue({
      sourceLocale: 'en-US',
      targetLocales: ['de', 'fr'],
    });

    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: APP_NAME }));

    expect(titleSetValue).toHaveBeenCalledWith('Hello', 'de');
    expect(titleSetValue).toHaveBeenCalledWith('Hello', 'fr');
    expect(bodySetValue).toHaveBeenCalledWith('World', 'de');
    expect(bodySetValue).toHaveBeenCalledWith('World', 'fr');
  });
});
