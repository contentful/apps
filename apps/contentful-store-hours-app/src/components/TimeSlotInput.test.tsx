import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeSlotInput from './TimeSlotInput';

describe('TimeSlotInput', () => {
  const defaultSlot = { open: '09:00', close: '17:00' };

  it('renders open and close time selects', () => {
    render(
      <TimeSlotInput slot={defaultSlot} onChange={() => {}} onRemove={() => {}} canRemove={false} />
    );

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue('09:00');
    expect(selects[1]).toHaveValue('17:00');
  });

  it('calls onChange when open time changes', () => {
    const handleChange = vi.fn();
    render(
      <TimeSlotInput
        slot={defaultSlot}
        onChange={handleChange}
        onRemove={() => {}}
        canRemove={false}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '10:00' } });

    expect(handleChange).toHaveBeenCalledWith({
      open: '10:00',
      close: '17:00',
    });
  });

  it('calls onChange when close time changes', () => {
    const handleChange = vi.fn();
    render(
      <TimeSlotInput
        slot={defaultSlot}
        onChange={handleChange}
        onRemove={() => {}}
        canRemove={false}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: '18:00' } });

    expect(handleChange).toHaveBeenCalledWith({
      open: '09:00',
      close: '18:00',
    });
  });

  it('shows remove button when canRemove is true', () => {
    render(
      <TimeSlotInput slot={defaultSlot} onChange={() => {}} onRemove={() => {}} canRemove={true} />
    );

    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('hides remove button when canRemove is false', () => {
    render(
      <TimeSlotInput slot={defaultSlot} onChange={() => {}} onRemove={() => {}} canRemove={false} />
    );

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(
      <TimeSlotInput
        slot={defaultSlot}
        onChange={() => {}}
        onRemove={handleRemove}
        canRemove={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(handleRemove).toHaveBeenCalled();
  });

  it('displays "to" between the time selects', () => {
    render(
      <TimeSlotInput slot={defaultSlot} onChange={() => {}} onRemove={() => {}} canRemove={false} />
    );

    expect(screen.getByText('to')).toBeInTheDocument();
  });
});
