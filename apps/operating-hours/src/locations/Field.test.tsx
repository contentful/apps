import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Field from './Field';
import { createMockFieldSdk } from '../test/mocks/mockSdk';
import { mockDefaultHours, mock24HourDay } from '../test/mocks/mockHours';
import type { FieldAppSDK } from '@contentful/app-sdk';

let mockSdk: FieldAppSDK;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Field', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSdk = createMockFieldSdk({ fieldValue: mockDefaultHours });
  });

  it('renders the Edit hours of operation button', () => {
    render(<Field />);
    expect(screen.getByRole('button', { name: 'Edit hours of operation' })).toBeInTheDocument();
  });

  it('displays open days count badge', () => {
    render(<Field />);
    // mockDefaultHours has 5 days open (Mon-Fri)
    expect(screen.getByText('5 days open')).toBeInTheDocument();
  });

  it('displays all days of the week', () => {
    render(<Field />);

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
  });

  it('displays "Closed" for closed days', () => {
    render(<Field />);

    // Saturday and Sunday are closed in mockDefaultHours
    const closedTexts = screen.getAllByText('Closed');
    expect(closedTexts.length).toBe(2);
  });

  it('displays formatted hours for open days', () => {
    render(<Field />);

    // Regular hours in mock are 9:00 AM - 5:00 PM
    expect(screen.getAllByText('9:00 AM - 5:00 PM').length).toBeGreaterThan(0);
  });

  it('displays "Open 24 hours" for 24-hour days', () => {
    const hoursWithOpen24 = {
      ...mockDefaultHours,
      monday: mock24HourDay,
    };
    mockSdk = createMockFieldSdk({ fieldValue: hoursWithOpen24 });

    render(<Field />);

    expect(screen.getByText('Open 24 hours')).toBeInTheDocument();
  });

  it('calls openCurrentApp when edit button is clicked', async () => {
    render(<Field />);

    fireEvent.click(screen.getByRole('button', { name: /edit hours of operation/i }));

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      parameters: { hours: mockDefaultHours, clockFormat: '12h' },
    });
  });

  it('displays "1 day open" singular form correctly', () => {
    const oneDayOpen = {
      ...mockDefaultHours,
      monday: {
        isOpen: true,
        is24Hours: false,
        slots: [{ open: '09:00', close: '17:00' }],
      },
      tuesday: { isOpen: false, is24Hours: false, slots: [] },
      wednesday: { isOpen: false, is24Hours: false, slots: [] },
      thursday: { isOpen: false, is24Hours: false, slots: [] },
      friday: { isOpen: false, is24Hours: false, slots: [] },
      saturday: { isOpen: false, is24Hours: false, slots: [] },
      sunday: { isOpen: false, is24Hours: false, slots: [] },
    };
    mockSdk = createMockFieldSdk({ fieldValue: oneDayOpen });

    render(<Field />);

    expect(screen.getByText('1 day open')).toBeInTheDocument();
  });

  it('uses 24-hour display when configured', () => {
    mockSdk = createMockFieldSdk({
      fieldValue: mockDefaultHours,
      installationParameters: { clockFormat: '24h' },
    });

    render(<Field />);

    expect(screen.getAllByText('09:00 - 17:00').length).toBeGreaterThan(0);
  });

  it('allows the time display format to be changed for a single entry', async () => {
    render(<Field />);

    fireEvent.change(screen.getByLabelText('Time display format'), {
      target: { value: '24h' },
    });

    await waitFor(() => {
      expect(screen.getAllByText('09:00 - 17:00').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole('button', { name: /edit hours of operation/i }));
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenLastCalledWith({
      parameters: { hours: mockDefaultHours, clockFormat: '24h' },
    });
  });

  it('uses configured default hours when the field is empty', () => {
    const customDefaults = {
      ...mockDefaultHours,
      monday: {
        isOpen: true,
        is24Hours: false,
        slots: [{ open: '10:00', close: '18:00' }],
      },
    };

    mockSdk = createMockFieldSdk({
      fieldValue: null,
      installationParameters: {
        useCustomDefaults: true,
        defaultHours: customDefaults,
      },
    });

    render(<Field />);

    expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument();
  });

  it('defaults to all days closed when custom defaults are disabled and the field is empty', () => {
    mockSdk = createMockFieldSdk({
      fieldValue: null,
      installationParameters: {
        useCustomDefaults: false,
      },
    });

    render(<Field />);

    expect(screen.getByText('0 days open')).toBeInTheDocument();
    expect(screen.getAllByText('Closed')).toHaveLength(7);
  });
});
