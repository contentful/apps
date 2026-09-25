import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DayRow from './DayRow';
import {
  mockRegularDay,
  mockClosedDay,
  mock24HourDay,
  mockSplitDay,
} from '../test/mocks/mockHours';

describe('DayRow', () => {
  const defaultProps = {
    day: 'monday' as const,
    dayHours: mockRegularDay,
    onChange: vi.fn(),
    onCopyToAll: vi.fn(),
    onCopyToWeekdays: vi.fn(),
  };

  it('displays the day name', () => {
    render(<DayRow {...defaultProps} />);
    expect(screen.getByText('Monday')).toBeInTheDocument();
  });

  it('shows switch in checked state when day is open', () => {
    render(<DayRow {...defaultProps} dayHours={mockRegularDay} />);
    const switchInput = screen.getByRole('switch');
    expect(switchInput).toBeChecked();
  });

  it('shows switch in unchecked state when day is closed', () => {
    render(<DayRow {...defaultProps} dayHours={mockClosedDay} />);
    const switchInput = screen.getByRole('switch');
    expect(switchInput).not.toBeChecked();
  });

  it('calls onChange when open switch is toggled', () => {
    const handleChange = vi.fn();
    render(<DayRow {...defaultProps} onChange={handleChange} />);

    const switchInput = screen.getByRole('switch');
    fireEvent.click(switchInput);

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isOpen: false }));
  });

  it('shows "Closed" text when day is closed', () => {
    render(<DayRow {...defaultProps} dayHours={mockClosedDay} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('shows "Open 24 hours" checkbox when day is open', () => {
    render(<DayRow {...defaultProps} dayHours={mockRegularDay} />);
    expect(screen.getByLabelText('Open 24 hours')).toBeInTheDocument();
  });

  it('shows checked "Open 24 hours" checkbox for 24 hour day', () => {
    render(<DayRow {...defaultProps} dayHours={mock24HourDay} />);
    expect(screen.getByLabelText('Open 24 hours')).toBeChecked();
  });

  it('shows time slot inputs for regular hours', () => {
    render(<DayRow {...defaultProps} dayHours={mockRegularDay} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('shows multiple time slots for split hours', () => {
    render(<DayRow {...defaultProps} dayHours={mockSplitDay} />);
    const selects = screen.getAllByRole('combobox');
    // 2 slots * 2 selects each = 4
    expect(selects).toHaveLength(4);
  });

  it('shows "Add hours" button for open day', () => {
    render(<DayRow {...defaultProps} dayHours={mockRegularDay} />);
    expect(screen.getByRole('button', { name: /add hours/i })).toBeInTheDocument();
  });

  it('does not show "Add hours" for 24 hour day', () => {
    render(<DayRow {...defaultProps} dayHours={mock24HourDay} />);
    expect(screen.queryByRole('button', { name: /add hours/i })).not.toBeInTheDocument();
  });

  it('does not show "Add hours" for closed day', () => {
    render(<DayRow {...defaultProps} dayHours={mockClosedDay} />);
    expect(screen.queryByRole('button', { name: /add hours/i })).not.toBeInTheDocument();
  });
});
