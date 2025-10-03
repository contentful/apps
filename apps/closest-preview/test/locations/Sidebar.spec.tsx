import Sidebar from '../../src/locations/Sidebar';
import { render, waitFor } from '@testing-library/react';
import { mockSdk } from '../mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  it('Renders entry list with titles and relative dates', async () => {
    const { getAllByText } = render(<Sidebar />);

    await waitFor(() => {
      const entryTitles = getAllByText('Entry id', { exact: false });
      expect(entryTitles).toHaveLength(5);
    });

    const updatedTexts = getAllByText(/Updated/);
    expect(updatedTexts).toHaveLength(5);
  });
});
