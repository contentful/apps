import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import Sidebar from '../src/locations/Sidebar';
import userEvent from '@testing-library/user-event';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display text and button', () => {
    render(<Sidebar />);

    expect(screen.getByText('Populate content across similar locales')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Field Populator' })).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const button = screen.getByRole('button', { name: 'Field Populator' });

    await user.click(button);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledOnce();
  });
});
