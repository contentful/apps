import React from 'react';
import Dialog from './Dialog';
import { render, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Dialog component', () => {
  it('renders custom date range controls', () => {
    mockSdk.parameters.invocation = {
      mode: 'customDateRange',
      startDate: '2026-4-3',
      endDate: '2026-4-10',
    };

    render(<Dialog />);

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
