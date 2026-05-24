import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeightFilter } from './WeightFilter';
import type { IconWeight } from '../../types/icon';

describe('WeightFilter', () => {
  const enabledWeights: IconWeight[] = ['regular', 'bold', 'fill'];

  it('renders all enabled weight options', () => {
    render(<WeightFilter value="regular" onChange={() => {}} enabledWeights={enabledWeights} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Open the select to see options
    expect(screen.getByText('Regular')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<WeightFilter value="bold" onChange={() => {}} enabledWeights={enabledWeights} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('bold');
  });

  it('calls onChange when selection changes', () => {
    const handleChange = vi.fn();
    render(
      <WeightFilter value="regular" onChange={handleChange} enabledWeights={enabledWeights} />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'fill' } });

    expect(handleChange).toHaveBeenCalledWith('fill');
  });

  it('only shows enabled weights', () => {
    const limitedWeights: IconWeight[] = ['thin', 'light'];
    render(<WeightFilter value="thin" onChange={() => {}} enabledWeights={limitedWeights} />);

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Thin');
    expect(options[1]).toHaveTextContent('Light');
  });

  it('has accessible label', () => {
    render(<WeightFilter value="regular" onChange={() => {}} enabledWeights={enabledWeights} />);

    expect(screen.getByLabelText('Filter by weight')).toBeInTheDocument();
  });
});
