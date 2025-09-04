import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ColumnMultiselect from '../../../src/locations/Page/components/ColumnMultiselect';

const mockOptions = [
  { label: 'Display name', value: 'displayName' },
  { label: 'Updated at', value: 'updatedAt' },
];

const mockLocalizedOptions = [
  { label: '(en-US) Display name', value: 'displayName-en-US' },
  { label: '(en-US) Description', value: 'description-en-US' },
  { label: '(es-AR) Display name', value: 'displayName-es-AR' },
  { label: '(es-AR) Description', value: 'description-es-AR' },
];

describe('ColumnMultiselect', () => {
  const defaultProps = {
    options: mockOptions,
    selectedFields: [],
    setSelectedFields: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('renders the multiselect component', async () => {
      render(<ColumnMultiselect {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('shows "No fields selected" when no fields are selected', async () => {
      render(<ColumnMultiselect {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('No fields selected')).toBeInTheDocument();
      });
    });

    it('shows field name when one field is selected', async () => {
      const selectedFields = [{ label: 'Display name', value: 'displayName' }];
      render(<ColumnMultiselect {...defaultProps} selectedFields={selectedFields} />);
      await waitFor(() => {
        expect(screen.findAllByText('Display name')).toBeTruthy();
      });
    });

    it('shows "Filter fields" when multiple fields are selected', async () => {
      const selectedFields = [
        { label: 'Display name', value: 'displayName' },
        { label: 'Updated at', value: 'updatedAt' },
      ];
      render(<ColumnMultiselect {...defaultProps} selectedFields={selectedFields} />);
      await waitFor(() => {
        expect(screen.getByText('Filter fields')).toBeInTheDocument();
      });
    });
  });

  describe('Selection functionality', () => {
    it('calls setSelectedFields with all options when select all is checked', async () => {
      render(<ColumnMultiselect {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);

      await waitFor(() => {
        expect(defaultProps.setSelectedFields).toHaveBeenCalledWith(mockOptions);
      });
    });

    it('calls setSelectedFields with empty array when select all is unchecked', async () => {
      const selectedFields = [
        { label: 'Display name', value: 'displayName' },
        { label: 'Updated at', value: 'updatedAt' },
      ];
      render(<ColumnMultiselect {...defaultProps} selectedFields={selectedFields} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const selectAllCheckbox = await waitFor(() =>
        screen.getByRole('checkbox', { name: /deselect all/i })
      );
      fireEvent.click(selectAllCheckbox);

      await waitFor(() => {
        expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([]);
      });
    });

    it('adds field to selection when individual option is checked', async () => {
      render(<ColumnMultiselect {...defaultProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const firstOption = await waitFor(() =>
        screen.getByRole('checkbox', { name: 'Display name' })
      );
      fireEvent.click(firstOption);

      await waitFor(() => {
        expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([
          { label: 'Display name', value: 'displayName' },
        ]);
      });
    });

    it('removes field from selection when individual option is unchecked', async () => {
      const selectedFields = [{ label: 'Display name', value: 'displayName' }];
      render(<ColumnMultiselect {...defaultProps} selectedFields={selectedFields} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const firstOption = await waitFor(() =>
        screen.getByRole('checkbox', { name: 'Display name' })
      );
      fireEvent.click(firstOption);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([]);
    });
  });

  describe('Localization functionality', () => {
    it('renders localized field options correctly', async () => {
      const localizedProps = {
        ...defaultProps,
        options: mockLocalizedOptions,
      };
      render(<ColumnMultiselect {...localizedProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('(en-US) Display name')).toBeInTheDocument();
        expect(screen.getByText('(en-US) Description')).toBeInTheDocument();
        expect(screen.getByText('(es-AR) Display name')).toBeInTheDocument();
        expect(screen.getByText('(es-AR) Description')).toBeInTheDocument();
      });
    });

    it('handles selection of localized fields correctly', async () => {
      const localizedProps = {
        ...defaultProps,
        options: mockLocalizedOptions,
      };
      render(<ColumnMultiselect {...localizedProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      const localizedOption = await waitFor(() =>
        screen.getByRole('checkbox', { name: '(en-US) Display name' })
      );
      fireEvent.click(localizedOption);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([
        { label: '(en-US) Display name', value: 'displayName-en-US' },
      ]);
    });
  });

  describe('Edge cases', () => {
    it('handles empty options array', async () => {
      const emptyProps = {
        ...defaultProps,
        options: [],
      };
      render(<ColumnMultiselect {...emptyProps} />);
      await waitFor(() => {
        expect(screen.getByText('No fields selected')).toBeInTheDocument();
      });
    });

    it('handles single option', async () => {
      const singleOptionProps = {
        ...defaultProps,
        options: [{ label: 'Single Field', value: 'single' }],
      };
      render(<ColumnMultiselect {...singleOptionProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Single Field')).toBeInTheDocument();
      });
    });

    it('handles options with special characters in labels', async () => {
      const specialOptions = [
        { label: 'Field with (parentheses)', value: 'field1' },
        { label: 'Field with & symbols', value: 'field2' },
      ];
      const specialProps = {
        ...defaultProps,
        options: specialOptions,
      };
      render(<ColumnMultiselect {...specialProps} />);

      const triggerButton = await waitFor(() => screen.getByRole('button'));
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Field with (parentheses)')).toBeInTheDocument();
        expect(screen.getByText('Field with & symbols')).toBeInTheDocument();
      });
    });
  });
});
