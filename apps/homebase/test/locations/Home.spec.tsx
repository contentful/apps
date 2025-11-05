import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Home from '../../src/locations/Home';
import {
  CONTENT_TYPE_ID,
  TITLE_ID,
  MARKDOWN_ID,
  DEFAULT_SELECT_LABEL,
  STORAGE_KEY,
} from '../../src/consts';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    clear: (): void => {
      store = {};
    },
  };
};

const getEditButton = (container: HTMLElement) => {
  const buttons = Array.from(container.querySelectorAll('button'));
  const selectButton = buttons.find(
    (btn) =>
      btn.textContent?.includes(DEFAULT_SELECT_LABEL) ||
      btn.textContent?.includes('First Entry') ||
      btn.textContent?.includes('Second Entry')
  );
  // The edit button is the other button
  return buttons.find((btn) => btn !== selectButton);
};

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

  let localStorageMock: ReturnType<typeof createLocalStorageMock>;
  const originalLocalStorage = window.localStorage; // Save original

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = createLocalStorageMock();

    // Replace global localStorage with our mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    mockCma.entry.getMany.mockResolvedValue({ items: mockEntries });
  });

  afterEach(() => {
    cleanup();
    localStorageMock.clear();

    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
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

    it('should display the first entry when loaded if there is no entry persisted', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('First Entry Title')).toBeInTheDocument();
      });
    });
  });

  describe('Entry Selection', () => {
    it('should display all entries in the dropdown menu', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('First Entry Title')).toBeInTheDocument();
      });

      // Click to open the menu
      fireEvent.click(screen.getByText('First Entry Title'));

      // Wait for menu items to appear
      await waitFor(
        () => {
          expect(screen.getAllByText('First Entry Title').length).toBe(2);
          expect(screen.getByText('Second Entry Title')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  it('should disable edit button when no entry is selected', async () => {
    mockCma.entry.getMany.mockResolvedValue({ items: mockEmptyEntries });

    const { container } = render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(DEFAULT_SELECT_LABEL)).toBeInTheDocument();
    });

    const editButton = getEditButton(container);
    expect(editButton).toBeDisabled();
  });

  it('should enable edit button when entry is selected', async () => {
    const { container } = render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('First Entry Title')).toBeInTheDocument();
    });

    await waitFor(() => {
      const editButton = getEditButton(container);
      expect(editButton).not.toBeDisabled();
    });
  });

  it('should call navigator.openEntry when edit button is clicked', async () => {
    const { container } = render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('First Entry Title')).toBeInTheDocument();
    });

    await waitFor(() => {
      const editButton = getEditButton(container);
      expect(editButton).not.toBeDisabled();
    });

    const editButton = getEditButton(container);
    if (editButton) {
      fireEvent.click(editButton);
    }

    await waitFor(() => {
      expect(mockSdk.navigator.openEntry).toHaveBeenCalledWith('entry-1', {
        slideIn: true,
      });
    });
  });

  describe('Empty State', () => {
    it('should handle empty entries list', async () => {
      mockCma.entry.getMany.mockResolvedValue({ items: mockEmptyEntries });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText(DEFAULT_SELECT_LABEL)).toBeInTheDocument();
        // Should not show any markdown preview when no entries
        expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();
      });
    });

    it('should render empty state UI and disable entry menu when no entries', async () => {
      mockCma.entry.getMany.mockResolvedValue({ items: mockEmptyEntries });

      render(<Home />);

      await waitFor(() => {
        // Button label is present and disabled
        const selectButton = screen.getByRole('button', { name: DEFAULT_SELECT_LABEL });
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

  describe('localStorage Persistence', () => {
    it('should save selected entry to localStorage when entry is selected', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('First Entry Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('First Entry Title'));
      await waitFor(() => {
        expect(screen.getByText('Second Entry Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Second Entry Title'));

      await waitFor(() => {
        expect(localStorageMock.getItem(STORAGE_KEY)).toBe('entry-2');
      });
    });

    it('should restore previous selected entry from localStorage on mount', async () => {
      localStorageMock.setItem(STORAGE_KEY, 'entry-2');

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Second Entry Title')).toBeInTheDocument();
      });
    });

    it('should not restore entry if saved entry ID does not exist in entries', async () => {
      localStorageMock.setItem(STORAGE_KEY, 'non-existent-entry');

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('First Entry Title')).toBeInTheDocument();
      });
    });
  });
});
