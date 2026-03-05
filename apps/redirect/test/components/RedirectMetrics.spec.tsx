import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';
import { RedirectMetrics } from '../../src/components/RedirectMetrics';

const mockMetrics = [
  { label: 'Total Redirects', value: 10 },
  { label: 'Active Redirects', value: 3 },
  { label: 'Inactive Redirects', value: 7 },
  { label: "Vanity URL's", value: 4 },
  { label: '301 Permanent', value: 6 },
  { label: '302 Temporary', value: 2 },
];

describe('RedirectMetrics component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all metric labels', () => {
    render(<RedirectMetrics metrics={mockMetrics} />);

    mockMetrics.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders all metric values', () => {
    render(<RedirectMetrics metrics={mockMetrics} />);

    mockMetrics.forEach(({ value }) => {
      expect(screen.getByText(String(value))).toBeInTheDocument();
    });
  });

  it('replaces every value with "—" when isLoading is true', () => {
    render(<RedirectMetrics metrics={mockMetrics} isLoading />);

    expect(screen.getAllByText('—')).toHaveLength(mockMetrics.length);
    mockMetrics.forEach(({ value }) => {
      expect(screen.queryByText(String(value))).not.toBeInTheDocument();
    });
  });

  it('still renders labels while loading', () => {
    render(<RedirectMetrics metrics={mockMetrics} isLoading />);

    mockMetrics.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
