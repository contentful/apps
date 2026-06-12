import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ConfigScreen from './ConfigScreen';
import { mockSdk } from '../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigScreen', () => {
  it('renders the configuration copy', () => {
    const { getByText } = render(<ConfigScreen />);

    expect(getByText('Experience Toolbar example')).toBeInTheDocument();
  });

  it('calls setReady once parameters are loaded', async () => {
    render(<ConfigScreen />);

    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());
  });
});
