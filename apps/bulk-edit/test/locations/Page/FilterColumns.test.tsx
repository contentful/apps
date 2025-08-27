import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterColumns from '../../../src/locations/Page/components/FilterColumns';

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

describe('FilterColumns', () => {
  const defaultProps = {
    options: mockOptions,
    selectedFields: [],
    setSelectedFields: vi.fn(),
  };

  describe('Basic functionality', () => {
    it('renders the multiselect component', () => {
      render(<FilterColumns {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows "No fields selected" when no fields are selected', () => {
      render(<FilterColumns {...defaultProps} />);
      expect(screen.getByText('No fields selected')).toBeInTheDocument();
    });

    it('shows single field name when one field is selected', () => {
      const selectedFields = [{ label: 'Display name', value: 'displayName' }];
      render(<FilterColumns {...defaultProps} selectedFields={selectedFields} />);
      const elements = screen.getAllByText('Display name');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('shows "Filter fields" when multiple fields are selected', () => {
      const selectedFields = [
        { label: 'Display name', value: 'displayName' },
        { label: 'Updated at', value: 'updatedAt' },
      ];
      render(<FilterColumns {...defaultProps} selectedFields={selectedFields} />);
      expect(screen.getByText('Filter fields')).toBeInTheDocument();
    });
  });

  describe('Selection functionality', () => {
    it('calls setSelectedFields with all options when select all is checked', () => {
      render(<FilterColumns {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith(mockOptions);
    });

    it('calls setSelectedFields with empty array when select all is unchecked', () => {
      const selectedFields = [
        { label: 'Display name', value: 'displayName' },
        { label: 'Updated at', value: 'updatedAt' },
      ];
      render(<FilterColumns {...defaultProps} selectedFields={selectedFields} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /deselect all/i });
      fireEvent.click(selectAllCheckbox);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([]);
    });

    it('adds field to selection when individual option is checked', () => {
      render(<FilterColumns {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const firstOption = screen.getByRole('checkbox', { name: 'Display name' });
      fireEvent.click(firstOption);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([
        { label: 'Display name', value: 'displayName' },
      ]);
    });

    it('removes field from selection when individual option is unchecked', () => {
      const selectedFields = [{ label: 'Display name', value: 'displayName' }];
      render(<FilterColumns {...defaultProps} selectedFields={selectedFields} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const firstOption = screen.getByRole('checkbox', { name: 'Display name' });
      fireEvent.click(firstOption);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([]);
    });
  });

  describe('Localization functionality', () => {
    it('renders localized field options correctly', () => {
      const localizedProps = {
        ...defaultProps,
        options: mockLocalizedOptions,
      };
      render(<FilterColumns {...localizedProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      expect(screen.getByText('(en-US) Display name')).toBeInTheDocument();
      expect(screen.getByText('(en-US) Description')).toBeInTheDocument();
      expect(screen.getByText('(es-AR) Display name')).toBeInTheDocument();
      expect(screen.getByText('(es-AR) Description')).toBeInTheDocument();
    });

    it('shows localized field name when one localized field is selected', () => {
      const selectedFields = [{ label: '(en-US) Display name', value: 'displayName-en-US' }];
      const localizedProps = {
        ...defaultProps,
        options: mockLocalizedOptions,
        selectedFields,
      };
      render(<FilterColumns {...localizedProps} />);
      const elements = screen.getAllByText('(en-US) Display name');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('handles selection of localized fields correctly', () => {
      const localizedProps = {
        ...defaultProps,
        options: mockLocalizedOptions,
      };
      render(<FilterColumns {...localizedProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const localizedOption = screen.getByRole('checkbox', { name: '(en-US) Display name' });
      fireEvent.click(localizedOption);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith([
        { label: '(en-US) Display name', value: 'displayName-en-US' },
      ]);
    });

    it('handles select all for localized fields', () => {
      const localizedProps = {
        ...defaultProps,
        options: mockLocalizedOptions,
      };
      render(<FilterColumns {...localizedProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);

      expect(defaultProps.setSelectedFields).toHaveBeenCalledWith(mockLocalizedOptions);
    });
  });

  describe('Edge cases', () => {
    it('handles empty options array', () => {
      const emptyProps = {
        ...defaultProps,
        options: [],
      };
      render(<FilterColumns {...emptyProps} />);
      expect(screen.getByText('No fields selected')).toBeInTheDocument();
    });

    it('handles single option', () => {
      const singleOptionProps = {
        ...defaultProps,
        options: [{ label: 'Single Field', value: 'single' }],
      };
      render(<FilterColumns {...singleOptionProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      expect(screen.getByText('Single Field')).toBeInTheDocument();
    });

    it('handles options with special characters in labels', () => {
      const specialOptions = [
        { label: 'Field with (parentheses)', value: 'field1' },
        { label: 'Field with & symbols', value: 'field2' },
      ];
      const specialProps = {
        ...defaultProps,
        options: specialOptions,
      };
      render(<FilterColumns {...specialProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      expect(screen.getByText('Field with (parentheses)')).toBeInTheDocument();
      expect(screen.getByText('Field with & symbols')).toBeInTheDocument();
    });
  });
});
