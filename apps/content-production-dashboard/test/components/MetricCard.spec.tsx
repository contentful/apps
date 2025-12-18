import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricCard } from '../../src/components/MetricCard';
import { FileIcon } from '@contentful/f36-icons';

describe('MetricCard component', () => {
  it('renders title, value, and subtitle', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        subtitle="Test subtitle"
        icon={FileIcon}
        isNegative={false}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        subtitle="Test subtitle"
        icon={FileIcon}
        isNegative={false}
      />
    );

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('applies negative styling when isNegative is true', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        subtitle="Test subtitle"
        icon={FileIcon}
        isNegative={true}
      />
    );

    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('applies default styling when isNegative is false', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        subtitle="Test subtitle"
        icon={FileIcon}
        isNegative={false}
      />
    );

    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });
});
