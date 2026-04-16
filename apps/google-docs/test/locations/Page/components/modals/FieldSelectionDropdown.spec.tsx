import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { FieldSelectionDropdown } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/FieldSelectionDropdown';

describe('FieldSelectionDropdown', () => {
  it('renders field status from field mappings and disables non-text options', async () => {
    const onSelectedFieldIdsChange = vi.fn();

    render(
      <FieldSelectionDropdown
        fieldMappings={[{ fieldId: 'name' }]}
        fieldOptions={[
          {
            id: 'name',
            fieldName: 'Name (Internal)',
            fieldType: 'Short text',
          },
          {
            id: 'marketo',
            fieldName: 'Marketo',
            fieldType: 'Reference',
          },
        ]}
        selectedFieldIds={[]}
        onSelectedFieldIdsChange={onSelectedFieldIdsChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Multiselect' }));

    await waitFor(() => {
      expect(screen.getByText('Name (Internal)')).toBeTruthy();
      expect(screen.getByText('(Short text)')).toBeTruthy();
      expect(screen.getByText('Filled')).toBeTruthy();
      expect(screen.getByText('Marketo')).toBeTruthy();
      expect(screen.getByText('(Reference)')).toBeTruthy();
      expect(screen.getByText('Empty')).toBeTruthy();
    });

    const enabledOption = screen.getByDisplayValue('name');
    const disabledOption = screen.getByDisplayValue('marketo');

    expect(enabledOption).not.toBeDisabled();
    expect(disabledOption).toBeDisabled();

    fireEvent.click(enabledOption);

    await waitFor(() => {
      expect(onSelectedFieldIdsChange).toHaveBeenCalledWith(['name']);
    });
  });
});
