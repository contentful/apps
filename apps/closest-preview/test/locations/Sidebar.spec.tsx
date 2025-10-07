import Sidebar from '../../src/locations/Sidebar';
import { render, waitFor, screen } from '@testing-library/react';
import { mockSdk } from '../mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  it('Renders 5 entries with links and relative dates', async () => {
    const { getAllByText } = render(<Sidebar />);

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
    });

    const updatedTexts = getAllByText(/Updated/);
    expect(updatedTexts).toHaveLength(5);
  });

  it('Shows loading state initially then renders list', async () => {
    render(<Sidebar />);
    // Initially, the list should not be present
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    expect(await screen.findByRole('list')).toBeInTheDocument();
  });

  it('Shows proper titles and fallbacks for different entry types', async () => {
    render(<Sidebar />);

    await waitFor(() => {
      // Entry with proper title should show the title
      expect(screen.getByRole('link', { name: 'Entry Title 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Entry Title 4' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Entry Title 5' })).toBeInTheDocument();
    });

    // Entries without titles should show ID prefix (first 8 chars)
    const links = await screen.findAllByRole('link');
    const fallbackLinks = links.filter((link) => link.textContent === 'Entry id');
    expect(fallbackLinks).toHaveLength(2); // Entry id 2 and Entry id 3
  });

  it('Builds correct web app entry link', async () => {
    render(<Sidebar />);

    const link = await screen.findByRole('link', { name: /Entry Title 1/ });

    expect(link).toHaveAttribute(
      'href',
      `https://${mockSdk.hostnames.webapp}/spaces/${mockSdk.ids.space}/environments/${mockSdk.ids.environment}/entries/Entry id 1`
    );
  });
});
