import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconSearch } from './IconSearch';

describe('IconSearch', () => {
  it('renders with default placeholder', () => {
    render(<IconSearch value="" onChange={() => {}} />);

    expect(screen.getByPlaceholderText('Search icons...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<IconSearch value="" onChange={() => {}} placeholder="Find an icon" />);

    expect(screen.getByPlaceholderText('Find an icon')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<IconSearch value="airplane" onChange={() => {}} />);

    expect(screen.getByDisplayValue('airplane')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = vi.fn();
    render(<IconSearch value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(handleChange).toHaveBeenCalledWith('test');
  });

  it('has accessible label', () => {
    render(<IconSearch value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Search icons')).toBeInTheDocument();
  });
});
