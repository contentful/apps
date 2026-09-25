import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dialog from './Dialog';
import { createMockDialogSdk } from '../test/mocks/mockSdk';
import { mockDefaultHours } from '../test/mocks/mockHours';
import type { DialogAppSDK } from '@contentful/app-sdk';

let mockSdk: DialogAppSDK;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Dialog', () => {
  beforeEach(() => {
    mockSdk = createMockDialogSdk({
      invocationParameters: { hours: mockDefaultHours },
    });
  });

  it('renders hours of operation title', () => {
    render(<Dialog />);
    expect(screen.getByText('Hours of Operation')).toBeInTheDocument();
  });

  it('renders all days of the week', () => {
    render(<Dialog />);

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
  });

  it('renders Save Hours and Cancel buttons', () => {
    render(<Dialog />);

    expect(screen.getByRole('button', { name: /save hours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls sdk.close with null when Cancel is clicked', () => {
    render(<Dialog />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockSdk.close).toHaveBeenCalledWith(null);
  });

  it('calls sdk.close with cleaned hours when Save Hours is clicked', () => {
    render(<Dialog />);

    fireEvent.click(screen.getByRole('button', { name: /save hours/i }));
    expect(mockSdk.close).toHaveBeenCalled();
  });

  it('renders Set All Closed button', () => {
    render(<Dialog />);

    expect(screen.getByRole('button', { name: /set all closed/i })).toBeInTheDocument();
  });

  it('cleans data on save - removes slots for closed days', () => {
    render(<Dialog />);

    fireEvent.click(screen.getByRole('button', { name: /save hours/i }));

    const savedHours = (mockSdk.close as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // Saturday and Sunday are closed, should have empty slots
    expect(savedHours.saturday.slots).toEqual([]);
    expect(savedHours.sunday.slots).toEqual([]);
    // Monday-Friday are open with regular hours, should keep slots
    expect(savedHours.monday.slots.length).toBeGreaterThan(0);
  });

  it('cleans data on save - forces is24Hours to false for closed days', () => {
    // Mock data where closed day incorrectly has is24Hours: true
    const messyHours = {
      ...mockDefaultHours,
      saturday: {
        isOpen: false,
        is24Hours: true, // This should be cleaned to false
        slots: [{ open: '09:00', close: '17:00' }],
      },
    };

    mockSdk = createMockDialogSdk({
      invocationParameters: { hours: messyHours },
    });

    render(<Dialog />);

    fireEvent.click(screen.getByRole('button', { name: /save hours/i }));

    const savedHours = (mockSdk.close as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedHours.saturday.is24Hours).toBe(false);
    expect(savedHours.saturday.slots).toEqual([]);
  });
});
