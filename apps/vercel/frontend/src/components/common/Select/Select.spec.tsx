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
    const { unmount } = render(<Select options={options} isLoading={false} {...defaultProps} />);
    const select = screen.getByText(defaultProps.placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText(options[0].name)).toBeTruthy();
    unmount();
  });

  it('renders message when no options exist', () => {
    const { unmount } = render(<Select options={[]} isLoading={false} {...defaultProps} />);
    const emptyMessage = screen.getByText(defaultProps.emptyMessage);

    expect(emptyMessage).toBeTruthy();
    unmount();
  });

  it('does not render empty message when in loading state', () => {
    const { unmount } = render(<Select options={[]} isLoading={true} {...defaultProps} />);
    const emptyMessage = screen.queryByText(defaultProps.emptyMessage);

    expect(emptyMessage).toBeFalsy();
    unmount();
  });
});
