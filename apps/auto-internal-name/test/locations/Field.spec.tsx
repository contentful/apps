import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createMockCma, createMockSdk } from '../../test/mocks';
import Field from '../../src/locations/Field';
import { EntryProps } from 'contentful-management';
import { MAX_RETRIES, INITIAL_DELAY_MS } from '../../src/utils/delay';
import { AppInstallationParameters } from '../../src/utils/types';

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
  ({ field, locales }: { field: any; locales: Record<string, string> }) => (
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
let mockInstallationParameters: AppInstallationParameters;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => vi.fn()(),
}));

vi.mock('../../src/hooks/useInstallationParameters', () => ({
  useInstallationParameters: () => mockInstallationParameters,
}));

vi.mock('@contentful/field-editor-single-line', () => ({
  SingleLineEditor: (props: any) => mockSingleLineEditor(props),
}));

describe.skip('Field component', () => {
  // Fixed time used consistently across all tests
  const FIXED_DATE = new Date('2024-01-01T12:00:00Z');

  const setupParentEntryMock = (parentEntry: EntryProps) => {
    mockCma.entry.getMany.mockResolvedValue({
      items: [parentEntry],
      total: 1,
    });
  };

  // Helper to render component and flush timers
  const renderAndFlushTimers = async () => {
    await act(async () => {
      render(<Field />);
      await vi.runAllTimersAsync();
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockCma = createMockCma();
    mockSdk = createMockSdk({
      cma: mockCma,
    });

    // Set default installation parameters
    mockInstallationParameters = {
      rules: [],
      separator: '-',
    };

    vi.setSystemTime(FIXED_DATE);

    mockSdk.field.getValue.mockReturnValue('');
    mockSdk.field.setValue.mockResolvedValue(undefined);

    // Set entry createdAt to 10 seconds ago (recently created)
    mockSdk.entry.getSys.mockReturnValue({
      id: 'current-entry-id',
      createdAt: new Date(FIXED_DATE.getTime() - 10 * 1000).toISOString(),
      updatedAt: FIXED_DATE.toISOString(),
    });
    mockCma.entry.getMany.mockResolvedValue({
      items: [],
      total: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  describe('Rendering', () => {
    it('should render the component with all required elements', async () => {
      await renderAndFlushTimers();

      expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
      const clearButton = screen.getByLabelText('Clear value');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute('title', 'Clear value');
      const refetchButton = screen.getByLabelText('Refetch value from parent');
      expect(refetchButton).toBeInTheDocument();
    });
  });

  describe('Clear button functionality', () => {
    it('should clear the field value when Clear button is clicked', async () => {
      mockSdk.field.getValue.mockReturnValue('existing value');
      await renderAndFlushTimers();

      const clearButton = screen.getByLabelText('Clear value');
      await act(async () => {
        fireEvent.click(clearButton);
        await vi.runAllTimersAsync();
      });

      expect(mockSdk.field.setValue).toHaveBeenCalledTimes(1);
      expect(mockSdk.field.setValue).toHaveBeenCalledWith('');
    });

    it('should be disabled when updating', async () => {
      await act(async () => {
        render(<Field />);
        await vi.runAllTimersAsync();
      });
      const clearButton = screen.getByLabelText('Clear value');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Refetch button functionality', () => {
    beforeEach(() => {
      // Set entry createdAt to 31 seconds ago (not recently created) to avoid auto-update on mount
      mockSdk.entry.getSys.mockReturnValue({
        id: 'current-entry-id',
        createdAt: new Date(FIXED_DATE.getTime() - 31 * 1000).toISOString(),
        updatedAt: FIXED_DATE.toISOString(),
      });
    });

    it('should refetch value from parent when parent is found', async () => {
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title',
        },
      });
      // Mock parent entry for refetch button click
      mockCma.entry.getMany.mockResolvedValueOnce({ items: [parentEntry], total: 1 });

      await renderAndFlushTimers();

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      await act(async () => {
        fireEvent.click(refetchButton);
        await vi.runAllTimersAsync();
      });

      expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title -');
    });

    it('should log error to console when refetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      mockCma.entry.getMany.mockRejectedValue(error);

      await renderAndFlushTimers();

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      await act(async () => {
        fireEvent.click(refetchButton);
        await vi.runAllTimersAsync();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating internal name:', error);
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

      await renderAndFlushTimers();

      expect(mockCma.entry.getMany).toHaveBeenCalled();
      expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title -');
    });

    it('should not auto-update when field already has a value', async () => {
      mockSdk.field.getValue.mockReturnValue('Existing value');

      await renderAndFlushTimers();

      expect(mockSdk.field.setValue).not.toHaveBeenCalled();
    });

    it('should not auto-update when entry is not recently created', async () => {
      // Set entry createdAt to 31 seconds ago (not recently created)
      mockSdk.entry.getSys.mockReturnValue({
        id: 'current-entry-id',
        createdAt: new Date(FIXED_DATE.getTime() - 31 * 1000).toISOString(),
        updatedAt: FIXED_DATE.toISOString(),
      });

      await renderAndFlushTimers();

      expect(mockSdk.field.setValue).not.toHaveBeenCalled();
    });

    it('should handle errors during auto-update gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Auto-update error');
      mockCma.entry.getMany.mockRejectedValue(error);

      await renderAndFlushTimers();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error auto-updating internal name:', error);
    });
  });

  describe('Field value construction', () => {
    it('should allow no separator', async () => {
      mockInstallationParameters.separator = '';
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title',
        },
      });

      setupParentEntryMock(parentEntry);

      await renderAndFlushTimers();

      expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title');
    });

    it('should use override field when content type has override', async () => {
      mockInstallationParameters.rules = [
        /*
        {
          id: 'override-1',
          fieldId: 'name',
          contentTypeId: 'test-content-type-id',
        },
        */
      ];

      const parentEntry = createMockEntry({
        name: {
          'en-US': 'Parent Name',
        },
      });

      setupParentEntryMock(parentEntry);

      await renderAndFlushTimers();

      expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Name -');
    });
  });

  describe('Localization', () => {
    it('should use current locale when field has a specific locale', async () => {
      // Set field locale to Spanish
      mockSdk.field.locale = 'es-ES';
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title EN',
          'es-ES': 'Título Padre ES',
        },
      });

      setupParentEntryMock(parentEntry);

      await renderAndFlushTimers();

      expect(mockSdk.field.setValue).toHaveBeenCalledWith('Título Padre ES -');
    });

    it('should leave field empty when current locale is not available in parent entry', async () => {
      // Set field locale to Spanish, but parent entry only has English
      mockSdk.field.locale = 'es-ES';
      const parentEntry = createMockEntry({
        title: {
          'en-US': 'Parent Title EN',
        },
      });

      mockCma.entry.getMany.mockResolvedValueOnce({ items: [parentEntry], total: 1 });

      await renderAndFlushTimers();

      expect(mockSdk.field.setValue).toHaveBeenCalledWith('');
    });
  });

  describe('Retry logic', () => {
    it('should retry finding parent entry when not found initially', async () => {
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

      // Advance through 3 retry delays (attempt 0: 500ms, attempt 1: 1000ms)
      const totalDelay = INITIAL_DELAY_MS * 3;
      vi.advanceTimersByTime(totalDelay);
      await vi.runAllTimersAsync();

      expect(mockCma.entry.getMany).toHaveBeenCalledTimes(3);
      expect(mockSdk.field.setValue).toHaveBeenCalledWith('Parent Title -');
    });

    it('should handle the case when the parent entry is not found after all retries', async () => {
      await renderAndFlushTimers();

      await act(async () => {
        // Advance timers through all retry delays
        const totalDelay = INITIAL_DELAY_MS * MAX_RETRIES + 1;
        vi.advanceTimersByTime(totalDelay);
        await vi.runAllTimersAsync();
      });

      expect(mockCma.entry.getMany).toHaveBeenCalledTimes(MAX_RETRIES + 1);
      expect(mockSdk.field.setValue).not.toHaveBeenCalled();
    });
  });
});
