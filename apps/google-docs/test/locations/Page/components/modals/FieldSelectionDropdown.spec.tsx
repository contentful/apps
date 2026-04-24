import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { FieldSelectionDropdown } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/FieldSelectionDropdown';

describe('FieldSelectionDropdown', () => {
  it('enables numeric field types only when the selected text is numeric', async () => {
    let selectedFieldIds: string[] = [];
    const onSelectedFieldIdsChange = vi.fn((updater: (prev: string[]) => string[]) => {
      selectedFieldIds = updater(selectedFieldIds);
    });

    render(
      <FieldSelectionDropdown
        selectedText="+5 "
        fieldMappings={[{ fieldId: 'name' }]}
        fieldOptions={[
          {
            id: 'name',
            fieldType: 'Symbol',
            fieldName: 'Name (Internal)',
            fieldDisplayType: 'Short text',
          },
          {
            id: 'marketo',
            fieldType: 'Asset',
            fieldName: 'Marketo',
            fieldDisplayType: 'Media',
          },
          {
            id: 'headingSize',
            fieldType: 'Integer',
            fieldName: 'Heading size',
            fieldDisplayType: 'Integer',
          },
          {
            id: 'price',
            fieldType: 'Number',
            fieldName: 'Price',
            fieldDisplayType: 'Number',
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
      expect(selectedFieldIds).toEqual(['name', 'headingSize', 'price']);
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
            fieldType: 'Symbol',
            fieldName: 'Title',
            fieldDisplayType: 'Short text',
          },
          {
            id: 'headingSize',
            fieldType: 'Integer',
            fieldName: 'Heading size',
            fieldDisplayType: 'Integer',
          },
          {
            id: 'price',
            fieldType: 'Number',
            fieldName: 'Price',
            fieldDisplayType: 'Number',
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

  it('shows link and array fields for text assignment but keeps them disabled', async () => {
    render(
      <FieldSelectionDropdown
        selectedText="Sample selected content"
        fieldMappings={[]}
        fieldOptions={[
          {
            id: 'title',
            fieldType: 'Symbol',
            fieldName: 'Title',
            fieldDisplayType: 'Short text',
          },
          {
            id: 'overrideTheme',
            fieldType: 'Reference',
            fieldName: 'Override Theme',
            fieldDisplayType: 'Reference',
          },
          {
            id: 'notes',
            fieldType: 'Reference list',
            fieldName: 'Notes',
            fieldDisplayType: 'Reference list',
          },
          {
            id: 'heroImage',
            fieldType: 'Asset',
            fieldName: 'Hero image',
            fieldDisplayType: 'Media',
            isAssetField: true,
          },
        ]}
        selectedFieldIds={[]}
        onSelectedFieldIdsChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Multiselect' }));

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('Override Theme')).toBeTruthy();
      expect(screen.getByText('Notes')).toBeTruthy();
      expect(screen.getByText('Hero image')).toBeTruthy();
    });

    expect(screen.getByDisplayValue('overrideTheme')).toBeDisabled();
    expect(screen.getByDisplayValue('notes')).toBeDisabled();
    expect(screen.getByDisplayValue('heroImage')).toBeDisabled();
    expect(screen.getByText('(Short text)')).toBeTruthy();
  });
});
