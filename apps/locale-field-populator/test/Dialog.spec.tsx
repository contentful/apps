import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import Dialog from '../src/locations/Dialog';

const defaultLocaleNames = { ...mockSdk.locales.names };

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.locales.names = { ...defaultLocaleNames };
  });

  it('renders the dialog with form controls', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Source locale')).toBeInTheDocument();
      expect(screen.getByText('Target locales')).toBeInTheDocument();
    });
  });

  it('renders Cancel and Next buttons', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  it('displays source locale select with placeholder', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select one')).toBeInTheDocument();
    });
  });

  it('displays available locales in source locale select', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('select-locale-en-us')).toBeInTheDocument();
      expect(screen.getAllByText('German').length).toBeGreaterThan(0);
      expect(screen.getAllByText('French').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Spanish (Spain)').length).toBeGreaterThan(0);
    });
  });

  it('renders LocaleMultiSelect component for target locales', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('close the dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockSdk.close).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a source locale', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select one')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('source-locale-select');
    await user.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('select-locale-en-us')).toBeInTheDocument();
    });
  });

  it('shows validation error when trying to proceed without selecting source locale', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    expect(screen.queryByText('Select source locale')).not.toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select source locale')).toBeInTheDocument();
    });
  });

  it('filters target locales to the same family and excludes the source locale', async () => {
    const user = userEvent.setup();
    mockSdk.locales.names = {
      ...mockSdk.locales.names,
      'en-GB': 'English (United Kingdom)',
      'en-CA': 'English (Canada)',
    };

    await act(async () => {
      render(<Dialog />);
    });

    const sourceSelect = screen.getByTestId('source-locale-select');
    await user.selectOptions(sourceSelect, 'en-US');

    const targetTrigger = await screen.findByText('Select one or more');
    await user.click(targetTrigger);

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'English (United Kingdom)' })
      ).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'English (Canada)' })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('checkbox', { name: 'English (United States)' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'German' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'French' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Spanish (Spain)' })).not.toBeInTheDocument();
  });

  it('shows validation error when trying to proceed without selecting target locales', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('source-locale-select');
    await user.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('select-locale-en-us')).toBeInTheDocument();
    });

    const sourceLocaleOption = screen.getByTestId('select-locale-en-us');
    await user.click(sourceLocaleOption);

    expect(screen.queryByText('Select target locales')).not.toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select target locales')).toBeInTheDocument();
    });
  });

  it('completes the full flow: locale selection, preview, and confirmation', async () => {
    const user = userEvent.setup();
    mockSdk.locales.names = {
      ...mockSdk.locales.names,
      'en-GB': 'English (United Kingdom)',
    };

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const sourceSelect = screen.getByTestId('source-locale-select');
    await user.selectOptions(sourceSelect, 'en-US');

    const targetTrigger = await screen.findByText('Select one or more');
    await user.click(targetTrigger);

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'English (United Kingdom)' })
      ).toBeInTheDocument();
    });

    const targetCheckbox = screen.getByRole('checkbox', { name: 'English (United Kingdom)' });
    await user.click(targetCheckbox);

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    expect(mockCma.entry.update).not.toHaveBeenCalled();

    // Click Confirm to populate fields
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    // Should show confirmation step with Done button
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    expect(mockCma.entry.update).toHaveBeenCalled();
  });

  it('completes the full flow with a reference field and updates both main and referenced entry', async () => {
    const user = userEvent.setup();
    const referencedEntryId = 'referenced-entry-id';
    const referencedContentTypeId = 'referenced-content-type';

    mockSdk.locales.names = {
      ...mockSdk.locales.names,
      'en-GB': 'English (United Kingdom)',
    };

    const mainEntryWithReference = {
      sys: {
        id: 'test-entry',
        type: 'Entry',
        contentType: { sys: { id: 'test-content-type' } },
      },
      fields: {
        title: { 'en-US': 'Main Title' },
        description: { 'en-US': 'Main Description' },
        linkedEntry: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: referencedEntryId },
          },
        },
      },
    };

    const mainContentTypeWithRefField = {
      sys: { id: 'test-content-type', type: 'ContentType' },
      name: 'Test Content Type',
      displayField: 'title',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', localized: true },
        { id: 'description', name: 'Description', type: 'Text', localized: true },
        {
          id: 'linkedEntry',
          name: 'Linked Entry',
          type: 'Link',
          linkType: 'Entry',
          localized: true,
        },
      ],
    };

    const referencedEntry = {
      sys: {
        id: referencedEntryId,
        type: 'Entry',
        contentType: { sys: { id: referencedContentTypeId } },
      },
      fields: {
        name: { 'en-US': 'Referenced Name' },
      },
    };

    const referencedContentType = {
      sys: { id: referencedContentTypeId, type: 'ContentType' },
      name: 'Referenced Content Type',
      displayField: 'name',
      fields: [{ id: 'name', name: 'Name', type: 'Symbol', localized: true }],
    };

    mockCma.entry.get.mockImplementation((params: { entryId: string }) => {
      if (params.entryId === 'test-entry') return Promise.resolve(mainEntryWithReference as any);
      if (params.entryId === referencedEntryId) return Promise.resolve(referencedEntry as any);
      return Promise.resolve(mainEntryWithReference as any);
    });

    mockCma.contentType.get.mockResolvedValue(mainContentTypeWithRefField);

    mockCma.entry.update.mockImplementation((_params: any, entry: any) => Promise.resolve(entry));

    mockCma.entry.getMany.mockResolvedValue({ items: [referencedEntry] });
    mockCma.contentType.getMany.mockResolvedValue({ items: [referencedContentType] });

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const sourceSelect = screen.getByTestId('source-locale-select');
    await user.selectOptions(sourceSelect, 'en-US');

    const targetTrigger = await screen.findByText('Select one or more');
    await user.click(targetTrigger);

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'English (United Kingdom)' })
      ).toBeInTheDocument();
    });

    const targetCheckbox = screen.getByRole('checkbox', { name: 'English (United Kingdom)' });
    await user.click(targetCheckbox);

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    expect(mockCma.entry.update).not.toHaveBeenCalled();

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    expect(mockCma.entry.update).toHaveBeenCalledTimes(2);

    const updateCalls = mockCma.entry.update.mock.calls as Array<[{ entryId: string }, unknown]>;
    const updatedEntryIds = updateCalls.map(([params]) => params.entryId);
    expect(updatedEntryIds).toContain('test-entry');
    expect(updatedEntryIds).toContain(referencedEntryId);
  });
});
