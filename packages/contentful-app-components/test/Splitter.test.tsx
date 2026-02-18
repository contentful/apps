import { render, screen } from '@testing-library/react';
import { Splitter } from '../components/Splitter';

describe('Splitter', () => {
  it('renders an hr element', () => {
    render(<Splitter />);

    const separator = screen.getByRole('separator');
    expect(separator.tagName).toBe('HR');
  });

  it('forwards additional props to the underlying element', () => {
    render(<Splitter testId="custom-splitter" />);

    const separator = screen.getByTestId('custom-splitter');
    expect(separator).toBeInTheDocument();
  });
});
