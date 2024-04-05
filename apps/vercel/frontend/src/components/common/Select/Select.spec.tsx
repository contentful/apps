import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Select } from './Select';

const options = [{ id: 'path-1', name: 'Path/1' }];
const defaultProps = {
  label: 'Options',
  placeholder: 'Please select an option',
  emptyMessage: 'No options configured',
  onChange: () => null,
  value: '',
};

describe('Select', () => {
  it('renders list of options to select', () => {
    render(<Select options={options} {...defaultProps} />);
    const select = screen.getByText(defaultProps.placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText(options[0].name)).toBeTruthy();
  });

  it('renders message when no options exist', () => {
    render(<Select options={[]} {...defaultProps} />);
    const emptyMessage = screen.getByText(defaultProps.emptyMessage);

    expect(emptyMessage).toBeTruthy();
  });
});
