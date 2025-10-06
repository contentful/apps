import Sidebar from '../../src/locations/Sidebar';
import { render, waitFor } from '@testing-library/react';
import { mockSdk } from '../mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  it('Renders entry list with ids and relative dates', async () => {
    const { getAllByText } = render(<Sidebar />);

    await waitFor(() => {
      const entryIds = getAllByText('Entry id', { exact: false });
      expect(entryIds).toHaveLength(5);
    });

    const updatedTexts = getAllByText(/Updated/);
    expect(updatedTexts).toHaveLength(5);
  });
});
