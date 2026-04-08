import Sidebar from '../../src/locations/Sidebar';
import { render, waitFor, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import { beforeEach, vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    mockSdk.parameters.installation = {};
    mockCma.entry.get.mockResolvedValue({
      sys: {
        id: 'root-entry',
        updatedAt: '2021-01-01',
        contentType: { sys: { id: 'blogPost' } },
      },
      fields: { title: { 'en-US': 'Root Entry' }, slug: { 'en-US': undefined } },
    });
    mockCma.entry.getMany.mockResolvedValue({
      items: [
        {
          sys: {
            id: 'Entry id 1',
            updatedAt: '2021-01-01',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': 'Entry Title 1' }, slug: { 'en-US': 'entry-1' } },
        },
        {
          sys: {
            id: 'Entry id 2',
            updatedAt: '2021-01-01',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': '' }, slug: { 'en-US': 'entry-2' } },
        },
        {
          sys: {
            id: 'Entry id 3',
            updatedAt: '2021-01-01',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': undefined }, slug: { 'en-US': 'entry-3' } },
        },
        {
          sys: {
            id: 'Entry id 4',
            updatedAt: '2021-01-01',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': 'Entry Title 4' }, slug: { 'en-US': 'entry-4' } },
        },
        {
          sys: {
            id: 'Entry id 5',
            updatedAt: '2021-01-01',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': 'Entry Title 5' }, slug: { 'en-US': 'entry-5' } },
        },
        {
          sys: {
            id: 'Entry id 6',
            updatedAt: '2021-01-01',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': 'Non-root (no slug)' }, slug: { 'en-US': undefined } },
        },
      ],
    });
  });

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

  it('Shows proper display field values and fallbacks for different entry types', async () => {
    render(<Sidebar />);

    await waitFor(() => {
      // Entries with proper titles should show display field values
      expect(screen.getByRole('link', { name: 'Entry Title 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Entry Title 4' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Entry Title 5' })).toBeInTheDocument();
    });

    // Entries without titles should show 'Untitled' fallback
    const links = await screen.findAllByRole('link');
    const fallbackLinks = links.filter((link) => link.textContent === 'Untitled');
    expect(fallbackLinks).toHaveLength(2); // Entry id 2 (empty title) and Entry id 3 (undefined title)
  });

  it('Builds correct web app entry link', async () => {
    render(<Sidebar />);

    const link = await screen.findByRole('link', { name: /Entry Title 1/ });

    expect(link).toHaveAttribute(
      'href',
      `https://${mockSdk.hostnames.webapp}/spaces/${mockSdk.ids.space}/environments/${mockSdk.ids.environmentAlias}/entries/Entry id 1`
    );
  });

  it('uses configured preview field ids from installation parameters', async () => {
    mockSdk.parameters.installation = { previewFieldIds: ['url'] };
    mockCma.entry.getMany.mockResolvedValue({
      items: [
        {
          sys: {
            id: 'Entry id url',
            updatedAt: '2021-01-02',
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: { title: { 'en-US': 'URL-backed page' }, url: { 'en-US': '/kb/article' } },
        },
      ],
    });

    render(<Sidebar />);

    expect(await screen.findByRole('link', { name: 'URL-backed page' })).toBeInTheDocument();
  });
});
