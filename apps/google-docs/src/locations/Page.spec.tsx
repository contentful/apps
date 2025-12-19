import Page from './Page';
import { render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

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
