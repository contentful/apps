import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressMessage } from '../../../src/locations/Page/components/ProgressMessage';

describe('ProgressMessage', () => {
  const defaultProps = {
    totalCount: 10,
    currentCount: 5,
    styles: { padding: '10px' },
  };

  it('renders the progress message with correct structure', () => {
    render(<ProgressMessage {...defaultProps} />);

    expect(screen.getByText('Updating entries')).toBeInTheDocument();
    expect(screen.getByText('5 of 10 completed')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
    render(<ProgressMessage totalCount={1000} currentCount={750} styles={{}} />);

    expect(screen.getByText('750 of 1000 completed')).toBeInTheDocument();
  });

  it('handles zero total count', () => {
    render(<ProgressMessage totalCount={0} currentCount={0} styles={{}} />);

    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
  });

  it('renders clock icon', () => {
    render(<ProgressMessage {...defaultProps} />);

    const clockIcon = document.querySelector('svg');
    expect(clockIcon).toBeInTheDocument();
  });

  it('handles negative numbers gracefully', () => {
    render(<ProgressMessage totalCount={-5} currentCount={-2} styles={{}} />);

    expect(screen.getByText('-2 of -5 completed')).toBeInTheDocument();
  });

  it('handles decimal numbers', () => {
    render(<ProgressMessage totalCount={10.5} currentCount={3.7} styles={{}} />);

    expect(screen.getByText('3.7 of 10.5 completed')).toBeInTheDocument();
  });
});
