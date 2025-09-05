import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import GenericMultiselect from '../../../src/locations/Page/components/GenericMultiselect';
import { Status } from '../../../src/locations/Page/types';
import { getAllStatuses } from '../../../src/locations/Page/utils/entryUtils';

describe('StatusMultiselect', () => {
  const statusOptions = getAllStatuses();

  const defaultStatusProps = {
    options: statusOptions,
    selectedItems: statusOptions, // All statuses selected by default
    setSelectedItems: vi.fn(),
    placeholderConfig: {
      noneSelected: 'No statuses selected',
      allSelected: 'Filter by status',
      singleSelected: '',
      multipleSelected: '',
    },
    truncateLength: 20,
    getItemKey: (item: Status) => item.label,
    getItemValue: (item: Status) => item.label,
    isItemSelected: (item: Status, selectedItems: Status[]) =>
      selectedItems.some((status) => status.label === item.label),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Status filter basic functionality', () => {
    it('renders all status options correctly', async () => {
      render(<GenericMultiselect<Status> {...defaultStatusProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Draft' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Changed' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Published' })).toBeInTheDocument();
      });
    });

    it('shows "Filter by status" when all statuses are selected', async () => {
      render(<GenericMultiselect<Status> {...defaultStatusProps} />);

      await waitFor(() => {
        expect(screen.getByText('Filter by status')).toBeInTheDocument();
      });
    });

    it('shows "No statuses selected" when no statuses are selected', async () => {
      const noStatusProps = {
        ...defaultStatusProps,
        selectedItems: [],
      };
      render(<GenericMultiselect<Status> {...noStatusProps} />);

      await waitFor(() => {
        expect(screen.getByText('No statuses selected')).toBeInTheDocument();
      });
    });

    it('shows individual status when only one is selected', async () => {
      const singleStatusProps = {
        ...defaultStatusProps,
        selectedItems: [{ label: 'Draft', color: 'warning' as const }],
      };
      render(<GenericMultiselect<Status> {...singleStatusProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Draft');
      });
    });
  });

  describe('Status selection functionality', () => {
    it('calls setSelectedItems with all statuses when select all is checked', async () => {
      const noStatusProps = {
        ...defaultStatusProps,
        selectedItems: [],
      };
      render(<GenericMultiselect<Status> {...noStatusProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);

      await waitFor(() => {
        expect(defaultStatusProps.setSelectedItems).toHaveBeenCalledWith(statusOptions);
      });
    });

    it('calls setSelectedItems with empty array when select all is unchecked', async () => {
      render(<GenericMultiselect<Status> {...defaultStatusProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const selectAllCheckbox = await waitFor(() =>
        screen.getByRole('checkbox', { name: /deselect all/i })
      );
      fireEvent.click(selectAllCheckbox);

      await waitFor(() => {
        expect(defaultStatusProps.setSelectedItems).toHaveBeenCalledWith([]);
      });
    });

    it('adds status to selection when individual option is checked', async () => {
      const noStatusProps = {
        ...defaultStatusProps,
        selectedItems: [],
      };
      render(<GenericMultiselect<Status> {...noStatusProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const draftOption = await waitFor(() => screen.getByRole('checkbox', { name: 'Draft' }));
      fireEvent.click(draftOption);

      await waitFor(() => {
        expect(defaultStatusProps.setSelectedItems).toHaveBeenCalledWith([
          { label: 'Draft', color: 'warning' as const },
        ]);
      });
    });

    it('removes status from selection when individual option is unchecked', async () => {
      const singleStatusProps = {
        ...defaultStatusProps,
        selectedItems: [{ label: 'Draft', color: 'warning' as const }],
      };
      render(<GenericMultiselect<Status> {...singleStatusProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const draftOption = await waitFor(() => screen.getByRole('checkbox', { name: 'Draft' }));
      fireEvent.click(draftOption);

      expect(defaultStatusProps.setSelectedItems).toHaveBeenCalledWith([]);
    });

    it('handles multiple status selection correctly', async () => {
      const twoStatusProps = {
        ...defaultStatusProps,
        selectedItems: [
          { label: 'Draft', color: 'warning' as const },
          { label: 'Published', color: 'positive' as const },
        ],
      };
      render(<GenericMultiselect<Status> {...twoStatusProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Draft' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Published' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Changed' })).not.toBeChecked();
      });
    });
  });

  describe('Status filter edge cases', () => {
    it('handles disabled state correctly', async () => {
      const disabledProps = {
        ...defaultStatusProps,
        disabled: true,
      };
      render(<GenericMultiselect<Status> {...disabledProps} />);

      const triggerButton = screen.getByRole('button');
      expect(triggerButton).toBeDisabled();
    });

    it('handles status options with special characters', async () => {
      const specialStatusOptions = [
        { label: 'Draft (New)', color: 'warning' as const },
        { label: 'Published & Live', color: 'positive' as const },
        { label: 'Changed - Modified', color: 'primary' as const },
      ];

      const specialProps = {
        ...defaultStatusProps,
        options: specialStatusOptions,
        selectedItems: [],
      };
      render(<GenericMultiselect<Status> {...specialProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Draft (New)')).toBeInTheDocument();
        expect(screen.getByText('Published & Live')).toBeInTheDocument();
        expect(screen.getByText('Changed - Modified')).toBeInTheDocument();
      });
    });

    it('maintains correct selection state when options change', async () => {
      const { rerender } = render(<GenericMultiselect<Status> {...defaultStatusProps} />);

      await waitFor(() => {
        expect(screen.getByText('Filter by status')).toBeInTheDocument();
      });

      // Change to only draft selected
      const draftOnlyProps = {
        ...defaultStatusProps,
        selectedItems: [{ label: 'Draft', color: 'warning' as const }],
      };
      rerender(<GenericMultiselect<Status> {...draftOnlyProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Draft');
      });
    });
  });
});
