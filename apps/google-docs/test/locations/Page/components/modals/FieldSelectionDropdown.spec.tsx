import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { FieldSelectionDropdown } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/FieldSelectionDropdown';

describe('FieldSelectionDropdown', () => {
  it('enables numeric field types only when the selected text is numeric', async () => {
    const onSelectedFieldIdsChange = vi.fn();

    render(
      <FieldSelectionDropdown
        selectedText="+5 "
        fieldMappings={[{ fieldId: 'name' }]}
        fieldOptions={[
          {
            id: 'name',
            fieldName: 'Name (Internal)',
            fieldType: 'Symbol',
          },
          {
            id: 'marketo',
            fieldName: 'Marketo',
            fieldType: 'Link',
          },
          {
            id: 'headingSize',
            fieldName: 'Heading size',
            fieldType: 'Integer',
          },
          {
            id: 'price',
            fieldName: 'Price',
            fieldType: 'Number',
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
      expect(screen.getByText('(Media)')).toBeTruthy();
      expect(screen.getAllByText('Empty').length).toBeGreaterThan(0);
      expect(screen.getByText('Heading size')).toBeTruthy();
      expect(screen.getByText('(Integer)')).toBeTruthy();
      expect(screen.getByText('Price')).toBeTruthy();
      expect(screen.getByText('(Number)')).toBeTruthy();
    });

    const enabledOption = screen.getByDisplayValue('name');
    const disabledOption = screen.getByDisplayValue('marketo');
    const integerOption = screen.getByDisplayValue('headingSize');
    const decimalOption = screen.getByDisplayValue('price');

    expect(enabledOption).not.toBeDisabled();
    expect(disabledOption).toBeDisabled();
    expect(integerOption).not.toBeDisabled();
    expect(decimalOption).not.toBeDisabled();

    fireEvent.click(enabledOption);
    fireEvent.click(integerOption);
    fireEvent.click(decimalOption);

    await waitFor(() => {
      expect(onSelectedFieldIdsChange).toHaveBeenCalledWith(['name']);
      expect(onSelectedFieldIdsChange).toHaveBeenCalledWith(['headingSize']);
      expect(onSelectedFieldIdsChange).toHaveBeenCalledWith(['price']);
    });
  });

  it('disables integer and decimal options when the selected text is not numeric', async () => {
    render(
      <FieldSelectionDropdown
        selectedText="Sample selected content"
        fieldMappings={[]}
        fieldOptions={[
          {
            id: 'title',
            fieldName: 'Title',
            fieldType: 'Symbol',
          },
          {
            id: 'headingSize',
            fieldName: 'Heading size',
            fieldType: 'Integer',
          },
          {
            id: 'price',
            fieldName: 'Price',
            fieldType: 'Number',
          },
        ]}
        selectedFieldIds={[]}
        onSelectedFieldIdsChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Multiselect' }));

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('Heading size')).toBeTruthy();
      expect(screen.getByText('Price')).toBeTruthy();
    });

    expect(screen.getByDisplayValue('title')).not.toBeDisabled();
    expect(screen.getByDisplayValue('headingSize')).toBeDisabled();
    expect(screen.getByDisplayValue('price')).toBeDisabled();
  });
});
