import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mockSdk } from '@test/mocks';
import { InformationalTables } from './InformationalTables';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('InformationalTables', () => {
  it('renders content', () => {
    render(<InformationalTables />);
    const table = screen.getAllByTestId('info-table');
    const link = screen.getByText('incoming links to entry by');

    expect(table).toHaveLength(2);
    expect(link).toBeTruthy();
  });
});
