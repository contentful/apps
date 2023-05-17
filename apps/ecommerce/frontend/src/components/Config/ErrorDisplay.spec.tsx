import { render, screen } from '@testing-library/react';
import ErrorDisplay from './ErrorDisplay';

describe('Error Display component', () => {
  it('mounts', () => {
    render(<ErrorDisplay error={new Error()} />);

    expect(screen.getByText(/Please try again later/)).toBeInTheDocument();
  });
});
