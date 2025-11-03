import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Home from '../../src/locations/Home';
import { CONTENT_TYPE_ID, TITLE_ID, MARKDOWN_ID } from '../../src/consts';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Home component', () => {
  const mockEntries = [
    {
      sys: { id: 'entry-1' },
      fields: {
        [TITLE_ID]: { 'en-US': 'First Entry Title' },
        [MARKDOWN_ID]: { 'en-US': '# First Entry\nThis is the first entry content.' },
      },
    },
    {
      sys: { id: 'entry-2' },
      fields: {
        [TITLE_ID]: { 'en-US': 'Second Entry Title' },
        [MARKDOWN_ID]: { 'en-US': '# Second Entry\nThis is the second entry content.' },
      },
    },
  ];

  const mockEmptyEntries: never[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCma.entry.getMany.mockResolvedValue({ items: mockEntries });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Loading and Initial State', () => {
    it('should load entries on mount', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(mockCma.entry.getMany).toHaveBeenCalledWith({
          query: {
            'sys.contentType.sys.id': CONTENT_TYPE_ID,
          },
        });
      });
    });

    it('should select first entry by default when entries are loaded', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('First Entry')).toBeInTheDocument();
        expect(screen.getByText('Select entry')).toBeInTheDocument();
        expect(screen.getByTestId('splitter')).toBeInTheDocument();
        expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
      });
    });
  });

  describe('Entry Selection', () => {
    it('should display all entries in the dropdown menu', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Select entry')).toBeInTheDocument();
      });

      // Click to open the menu
      fireEvent.click(screen.getByText('Select entry'));

      // Wait for menu items to appear
      await waitFor(
        () => {
          expect(screen.getByText('First Entry Title')).toBeInTheDocument();
          expect(screen.getByText('Second Entry Title')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Empty State', () => {
    it('should handle empty entries list', async () => {
      mockCma.entry.getMany.mockResolvedValue({ items: mockEmptyEntries });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Select entry')).toBeInTheDocument();
        // Should not show any markdown preview when no entries
        expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();
      });
    });

    it('should render empty state UI and disable entry menu when no entries', async () => {
      mockCma.entry.getMany.mockResolvedValue({ items: mockEmptyEntries });

      render(<Home />);

      await waitFor(() => {
        // Button label is present and disabled
        const selectButton = screen.getByRole('button', { name: 'Select entry' });
        expect(selectButton).toBeDisabled();

        // Empty state messaging
        expect(screen.getByText('No Homebase entry to display.')).toBeInTheDocument();
        expect(
          screen.getByText('Create an entry using the HOMEBASE content type.')
        ).toBeInTheDocument();
      });
    });

    it('should open create entry dialog when clicking Create entry', async () => {
      mockCma.entry.getMany.mockResolvedValue({ items: mockEmptyEntries });

      render(<Home />);

      // Wait for empty state to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create entry' })).toBeInTheDocument();
      });

      // Click create
      fireEvent.click(screen.getByRole('button', { name: 'Create entry' }));

      await waitFor(() => {
        expect(mockSdk.navigator.openNewEntry).toHaveBeenCalledWith(CONTENT_TYPE_ID, {
          slideIn: { waitForClose: true },
        });
      });
    });
  });
});
