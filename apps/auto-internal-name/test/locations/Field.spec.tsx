import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createMockCma, createMockSdk } from '../../test/mocks';
import Field from '../../src/locations/Field';
import { EntryProps } from 'contentful-management';
import * as delayUtils from '../../src/utils/delay';
import * as entryUtils from '../../src/utils/entryUtils';
import { FieldAppSDK } from '@contentful/app-sdk';
import { MAX_RETRIES } from '../../src/utils/delay';

const createMockEntry = (fields: Record<string, Record<string, string>>): EntryProps => ({
  sys: {
    id: 'parent-entry-id',
    type: 'Entry',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    contentType: { sys: { id: 'parent-content-type', type: 'Link', linkType: 'ContentType' } },
    space: { sys: { id: 'space-id', type: 'Link', linkType: 'Space' } },
    environment: { sys: { id: 'env-id', type: 'Link', linkType: 'Environment' } },
    version: 1,
    publishedVersion: 1,
    publishedAt: '2024-01-01T00:00:00Z',
    firstPublishedAt: '2024-01-01T00:00:00Z',
    publishedCounter: 1,
    status: { sys: { id: 'published', type: 'Link', linkType: 'Status' } },
    automationTags: [],
  },
  fields,
  metadata: { tags: [] },
});

const mockSingleLineEditor = vi.fn(
  ({ field, locales }: { field: FieldAppSDK['field']; locales: Record<string, string> }) => (
    <div data-test-id="single-line-editor">
      <input
        value={field.getValue() || ''}
        onChange={(e) => field.setValue(e.target.value)}
        placeholder="Enter your new value"
      />
      <span>{JSON.stringify(locales)}</span>
    </div>
  )
);

let mockSdk: ReturnType<typeof createMockSdk>;
let mockCma: ReturnType<typeof createMockCma>;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => vi.fn()(),
}));

vi.mock('@contentful/field-editor-single-line', () => ({
  SingleLineEditor: (props: any) => mockSingleLineEditor(props),
}));

vi.mock('../../src/utils/delay', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
  MAX_RETRIES: 4,
}));

vi.mock('../../src/utils/entryUtils', () => ({
  isEntryRecentlyCreated: vi.fn().mockReturnValue(true),
}));

describe('Field component', () => {
  const setupParentEntryMock = (parentEntry: EntryProps) => {
    mockCma.entry.getMany.mockResolvedValue({
      items: [parentEntry],
      total: 1,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCma = createMockCma();
    mockSdk = createMockSdk({
      cma: mockCma,
    });

    mockSdk.field.getValue.mockReturnValue('');
    mockSdk.field.setValue.mockResolvedValue(undefined);
    mockSdk.entry.getSys.mockReturnValue({
      id: 'current-entry-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mockCma.entry.getMany.mockResolvedValue({
      items: [],
      total: 0,
    });
    vi.mocked(entryUtils.isEntryRecentlyCreated).mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render the component with all required elements', async () => {
      render(<Field />);

      await waitFor(() => {
        expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
        const clearButton = screen.getByLabelText('Clear value');
        expect(clearButton).toBeInTheDocument();
        expect(clearButton).toHaveAttribute('title', 'Clear value');
        const refetchButton = screen.getByLabelText('Refetch value from parent');
        expect(refetchButton).toBeInTheDocument();
      });
    });
  });

  describe('Clear button functionality', () => {
    it('should clear the field value when Clear button is clicked', async () => {
      mockSdk.field.getValue.mockReturnValue('existing value');

      render(<Field />);

      await waitFor(() => {
        const clearButton = screen.getByLabelText('Clear value');
        fireEvent.click(clearButton);
        expect(mockSdk.field.setValue).toHaveBeenCalledTimes(1);
        expect(mockSdk.field.setValue).toHaveBeenCalledWith('');
      });
    });

    it('should be disabled when updating', () => {
      render(<Field />);
      const clearButton = screen.getByLabelText('Clear value');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Refetch button functionality', () => {
    beforeEach(() => {
      // to avoid auto-update on mount
      vi.mocked(entryUtils.isEntryRecentlyCreated).mockReturnValue(false);
    });
    it('should find parent entry and update field when parent is found', async () => {
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title',
        },
      });
      // Mock parent entry for refetch button click
      mockCma.entry.getMany.mockResolvedValueOnce({ items: [parentEntry], total: 1 });

      render(<Field />);

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      fireEvent.click(refetchButton);

      await waitFor(() => {
        expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title -');
      });
    });

    it('should handle case when no parent entry is found', async () => {
      render(<Field />);

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      fireEvent.click(refetchButton);

      await waitFor(() => {
        expect(mockCma.entry.getMany).toHaveBeenCalledTimes(MAX_RETRIES + 1);
        expect(mockSdk.field.setValue).not.toHaveBeenCalled();
      });
    });

    it('should log error to console when refetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      mockCma.entry.getMany.mockRejectedValue(error);

      render(<Field />);

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      fireEvent.click(refetchButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating internal name:', error);
      });
    });
  });

  describe('Auto-update on mount', () => {
    it('should auto-update field when entry is recently created and parent is found', async () => {
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title',
        },
      });

      setupParentEntryMock(parentEntry);

      render(<Field />);

      await waitFor(() => {
        expect(mockCma.entry.getMany).toHaveBeenCalled();
        expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title -');
      });
    });

    it('should not auto-update when field already has a value', async () => {
      mockSdk.field.getValue.mockReturnValue('Existing value');

      render(<Field />);

      expect(mockSdk.field.setValue).not.toHaveBeenCalled();
    });

    it('should not auto-update when entry is not recently created', async () => {
      vi.mocked(entryUtils.isEntryRecentlyCreated).mockReturnValue(false);

      render(<Field />);

      expect(mockSdk.field.setValue).not.toHaveBeenCalled();
    });

    it('should handle errors during auto-update gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Auto-update error');
      mockCma.entry.getMany.mockRejectedValue(error);

      render(<Field />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error auto-updating internal name:', error);
      });
    });
  });

  describe('Field value construction', () => {
    it('should allow no separator', async () => {
      mockSdk.parameters.installation.separator = undefined;
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title',
        },
      });

      setupParentEntryMock(parentEntry);

      render(<Field />);

      await waitFor(() => {
        expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title');
      });
    });

    it('should use override field when content type has override', async () => {
      mockSdk.parameters.installation.overrides = [
        {
          id: 'override-1',
          fieldId: 'name',
          contentTypeId: 'test-content-type-id',
        },
      ];

      const parentEntry = createMockEntry({
        name: {
          'en-US': 'Parent Name',
        },
      });

      setupParentEntryMock(parentEntry);

      render(<Field />);

      await waitFor(() => {
        expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Name -');
      });
    });
  });

  describe('Retry logic', () => {
    it('should retry finding parent entry when not found initially', async () => {
      const delay = delayUtils.delay as ReturnType<typeof vi.fn>;

      mockCma.entry.getMany
        .mockResolvedValueOnce({ items: [], total: 0 })
        .mockResolvedValueOnce({ items: [], total: 0 })
        .mockResolvedValueOnce({
          items: [
            createMockEntry({
              title: { 'en-US': 'Parent Title' },
            }),
          ],
          total: 1,
        });

      render(<Field />);

      await waitFor(
        () => {
          expect(mockCma.entry.getMany).toHaveBeenCalledTimes(3);
        },
        { timeout: 3000 }
      );

      expect(delay).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after max retries', async () => {
      render(<Field />);

      await waitFor(
        () => {
          expect(mockCma.entry.getMany).toHaveBeenCalledTimes(MAX_RETRIES + 1);
        },
        { timeout: 5000 }
      );
    });
  });
});
