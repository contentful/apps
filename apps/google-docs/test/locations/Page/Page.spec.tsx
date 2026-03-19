import Page from '../../../src/locations/Page/Page';
import { render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../mocks';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('renders the Google Drive heading', async () => {
    const { getByRole } = render(<Page />);

    await waitFor(() => {
      expect(getByRole('heading', { name: 'Google Drive' })).toBeTruthy();
    });
  });
});
