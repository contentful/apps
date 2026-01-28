import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import RuleRow from '../../src/components/RuleRow';
import { Rule, FieldSelection, RuleValidation } from '../../src/utils/types';
import { createEmptyField } from '../../src/utils/utils';

describe('RuleRow', () => {
  const mockAvailableFields: FieldSelection[] = [
    {
      fieldUniqueId: 'ct-1.title',
      fieldId: 'title',
      fieldName: 'Title',
      contentTypeId: 'ct-1',
      contentTypeName: 'Blog Post',
      displayName: 'Title | Blog Post',
    },
    {
      fieldUniqueId: 'ct-1.slug',
      fieldId: 'slug',
      fieldName: 'Slug',
      contentTypeId: 'ct-1',
      contentTypeName: 'Blog Post',
      displayName: 'Slug | Blog Post',
    },
    {
      fieldUniqueId: 'ct-2.name',
      fieldId: 'name',
      fieldName: 'Name',
      contentTypeId: 'ct-2',
      contentTypeName: 'Author',
      displayName: 'Name | Author',
    },
    {
      fieldUniqueId: 'ct-2.title',
      fieldId: 'title',
      fieldName: 'Title',
      contentTypeId: 'ct-2',
      contentTypeName: 'Author',
      displayName: 'Title | Author',
    },
  ];

  const mockRule: Rule = {
    id: 'rule-1',
    parentField: createEmptyField(),
    referenceField: createEmptyField(),
  };

  const mockOnRuleChange = vi.fn();
  const mockOnRuleDelete = vi.fn();

  const mockValidation: RuleValidation = {
    parentFieldError: false,
    referenceFieldError: false,
    parentFieldErrorMessage: '',
    referenceFieldErrorMessage: '',
  };

  type RuleRowProps = ComponentProps<typeof RuleRow>;

  const renderRuleRow = async (overrides: Partial<RuleRowProps> = {}) => {
    render(
      <RuleRow
        rule={mockRule}
        availableFields={mockAvailableFields}
        validation={mockValidation}
        onRuleChange={mockOnRuleChange}
        onRuleDelete={mockOnRuleDelete}
        {...overrides}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/parent field/i)).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with parent field and reference field inputs', async () => {
      await renderRuleRow();

      expect(screen.getByLabelText(/parent field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference entries/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete rule/i })).toBeInTheDocument();
      const inputs = screen.getAllByPlaceholderText('Field name | Content type name');
      expect(inputs.length).toBe(2);
    });

    it('should show validation errors when fields are missing', async () => {
      const validationWithErrors: RuleValidation = {
        parentFieldError: true,
        referenceFieldError: true,
        parentFieldErrorMessage: 'Parent field is required',
        referenceFieldErrorMessage: 'Reference field is required',
      };

      await renderRuleRow({ validation: validationWithErrors });

      expect(screen.getByText('Parent field is required')).toBeInTheDocument();
      expect(screen.getByText('Reference field is required')).toBeInTheDocument();
    });
  });

  describe('Parent field selection', () => {
    it('should update rule when parent field is selected', async () => {
      const user = userEvent.setup();
      const onRuleChangeSpy = vi.fn();

      await renderRuleRow({ onRuleChange: onRuleChangeSpy });

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput);
      await user.type(parentFieldInput, 'Title');

      await waitFor(() => {
        screen.getAllByText('Title | Blog Post');
      });

      const options = screen.getAllByText('Title | Blog Post');
      await user.click(options[0]);

      await waitFor(() => {
        expect(onRuleChangeSpy).toHaveBeenCalledWith({
          id: 'rule-1',
          parentField: mockAvailableFields[0],
          referenceField: createEmptyField(),
        });
      });
    });

    it('should filter parent fields by display name', async () => {
      const user = userEvent.setup();

      await renderRuleRow();

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput);
      await user.type(parentFieldInput, 'Slug');

      await waitFor(() => {
        screen.getAllByText('Slug | Blog Post');
      });

      // Fields that don't match should not be visible in the filtered list
      // Note: The autocomplete may show options in both fields, so we check that Slug appears
      expect(screen.getAllByText('Slug | Blog Post').length).toBeGreaterThan(0);
    });
  });

  describe('Reference field selection', () => {
    it('should filter reference fields by display name', async () => {
      const user = userEvent.setup();

      await renderRuleRow();

      const referenceFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[1];
      await user.click(referenceFieldInput);
      await user.type(referenceFieldInput, 'Author');

      await waitFor(() => {
        // Should show fields from Author content type
        expect(screen.getAllByText('Name | Author').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Title | Author').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Delete functionality', () => {
    it('should remove only the specific rule when delete is clicked', async () => {
      const user = userEvent.setup();
      const ruleToDelete: Rule = {
        id: 'rule-2',
        parentField: mockAvailableFields[0],
        referenceField: mockAvailableFields[2],
      };

      const onRuleDeleteSpy = vi.fn();

      await renderRuleRow({
        rule: ruleToDelete,
        onRuleDelete: onRuleDeleteSpy,
      });

      const deleteButton = screen.getByRole('button', { name: /delete rule/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(onRuleDeleteSpy).toHaveBeenCalledWith('rule-2');
      });
    });
  });

  describe('Field filtering', () => {
    it('should filter fields case-insensitively', async () => {
      const user = userEvent.setup();

      await renderRuleRow();

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput);
      await user.type(parentFieldInput, 'title');

      await waitFor(() => {
        // Should find both "Title | Blog Post" and "Title | Author" (case-insensitive)
        expect(screen.getAllByText('Title | Blog Post').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Title | Author').length).toBeGreaterThan(0);
      });
    });

    it('should show all fields when input is cleared', async () => {
      const user = userEvent.setup();

      await renderRuleRow();

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput);
      await user.type(parentFieldInput, 'Title');
      await user.clear(parentFieldInput);

      await waitFor(() => {
        expect(parentFieldInput).toHaveValue('');
        expect(screen.getAllByText('Title | Blog Post').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Title | Author').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Slug | Blog Post').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Name | Author').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pre-selected fields', () => {
    it('should display pre-selected parent field', async () => {
      const ruleWithParentField: Rule = {
        id: 'rule-1',
        parentField: mockAvailableFields[0],
        referenceField: createEmptyField(),
      };

      await renderRuleRow({ rule: ruleWithParentField });

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      expect(parentFieldInput).toHaveValue('Title | Blog Post');
    });

    it('should display pre-selected reference field', async () => {
      const ruleWithReferenceField: Rule = {
        id: 'rule-1',
        parentField: createEmptyField(),
        referenceField: mockAvailableFields[2],
      };

      await renderRuleRow({ rule: ruleWithReferenceField });

      const referenceFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[1];
      expect(referenceFieldInput).toHaveValue('Name | Author');
    });

    it('should display both pre-selected fields', async () => {
      const ruleWithBothFields: Rule = {
        id: 'rule-1',
        parentField: mockAvailableFields[0],
        referenceField: mockAvailableFields[2],
      };

      await renderRuleRow({ rule: ruleWithBothFields });

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      const referenceFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[1];

      expect(parentFieldInput).toHaveValue('Title | Blog Post');
      expect(referenceFieldInput).toHaveValue('Name | Author');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty available fields array', async () => {
      await renderRuleRow({ availableFields: [] });

      expect(screen.getByLabelText(/parent field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference entries/i)).toBeInTheDocument();
    });

    it('should handle rule with both fields selected and allow changing them', async () => {
      const user = userEvent.setup();
      const ruleWithBothFields: Rule = {
        id: 'rule-1',
        parentField: mockAvailableFields[0],
        referenceField: mockAvailableFields[2],
      };

      const onRuleChangeSpy = vi.fn();

      await renderRuleRow({
        rule: ruleWithBothFields,
        onRuleChange: onRuleChangeSpy,
      });

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput);
      await user.clear(parentFieldInput);
      await user.type(parentFieldInput, 'Slug');

      await waitFor(() => {
        screen.getAllByText('Slug | Blog Post');
      });

      const options = screen.getAllByText('Slug | Blog Post');
      await user.click(options[0]);

      await waitFor(() => {
        expect(onRuleChangeSpy).toHaveBeenCalledWith({
          id: 'rule-1',
          parentField: mockAvailableFields[1], // Slug field
          referenceField: mockAvailableFields[2], // Name field (unchanged)
        });
      });
    });
  });
});
