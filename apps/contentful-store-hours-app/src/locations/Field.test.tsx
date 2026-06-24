import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    mockSdk = createMockFieldSdk({ fieldValue: mockDefaultHours });
  });

  it('renders the Edit Hours of Operation button', () => {
    render(<Field />);
    expect(screen.getByRole('button', { name: /edit hours of operation/i })).toBeInTheDocument();
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
      parameters: { hours: mockDefaultHours },
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
});
