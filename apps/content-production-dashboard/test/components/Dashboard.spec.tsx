import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dashboard from '../../src/components/Dashboard';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Dashboard component', () => {
  it('renders the dashboard heading', () => {
    render(<Dashboard />);

    expect(screen.getByText('Content Dashboard')).toBeInTheDocument();
  });

  it('renders the refresh button', () => {
    render(<Dashboard />);

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('renders all metric cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Total Published')).toBeInTheDocument();
    expect(screen.getByText('Average Time to Publish')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeTruthy();
    expect(screen.getByText('Recently Published')).toBeInTheDocument();
    expect(screen.getByText('Needs Update')).toBeInTheDocument();
  });
});
