import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BulkEditModal } from '../../../src/locations/Page/components/BulkEditModal';
import { ContentTypeField, Entry } from '../../../src/locations/Page/types';
import { mockSdk } from '../../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('BulkEditModal', () => {
  const field: ContentTypeField = {
    contentTypeId: 'test-content-type',
    id: 'size',
    uniqueId: 'size',
    name: 'Size',
    type: 'Number',
    required: true,
    fieldControl: { fieldId: 'size', widgetId: 'numberEditor' },
    validations: [],
  };
  const entry1: Entry = {
    sys: { id: '1', contentType: { sys: { id: 'condoA' } }, version: 1 },
    fields: { displayName: { 'en-US': 'Building one' }, size: { 'en-US': 1000 } },
  };
  const entry2: Entry = {
    sys: { id: '2', contentType: { sys: { id: 'condoA' } }, version: 2 },
    fields: { displayName: { 'en-US': 'Building two' }, size: { 'en-US': 2000 } },
  };

  it('renders subtitle for single entry', () => {
    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedEntries={[entry1]}
        selectedField={field}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
      />
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
  });

  it('renders correct subtitle for multiple entries', () => {
    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedEntries={[entry1, entry2]}
        selectedField={field}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
      />
    );
    expect(screen.getByText('Bulk edit')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('selected and 1 more')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <BulkEditModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
        selectedEntries={[entry1]}
        selectedField={field}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
      />
    );
    fireEvent.click(screen.getByTestId('bulk-edit-cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with value when Save is clicked', async () => {
    const onSave = vi.fn();
    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        selectedEntries={[entry1]}
        selectedField={field}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
      />
    );
    const input = await screen.findByTestId('number-editor-input');

    await waitFor(() => {
      fireEvent.change(input, { target: { value: '1234' } });
      fireEvent.click(screen.getByTestId('bulk-edit-save'));
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('resets the input value when the modal is re-opened', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const modalComponent = (isOpened: boolean) => {
      return (
        <BulkEditModal
          isOpen={isOpened}
          onClose={onClose}
          onSave={onSave}
          selectedEntries={[entry1]}
          selectedField={field}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );
    };
    const { rerender } = render(modalComponent(true));

    await waitFor(() => {
      const input = screen.getByTestId('number-editor-input');
      fireEvent.change(input, { target: { value: '999' } });
      expect(input).toHaveValue('999');
    });

    rerender(modalComponent(false));

    rerender(modalComponent(true));
  });

  it('shows progress message during saving', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <BulkEditModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        selectedEntries={[entry1, entry2]}
        selectedField={field}
        locales={mockSdk.locales}
        isSaving={true}
        totalUpdateCount={2}
        editionCount={1}
      />
    );

    expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    expect(screen.getByText('Updating entries')).toBeInTheDocument();
  });

  it('does not show progress message when not saving', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <BulkEditModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        selectedEntries={[entry1, entry2]}
        selectedField={field}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
      />
    );

    expect(screen.queryByText('Updating entries')).not.toBeInTheDocument();
  });

  it('displays validation error when invalid value is entered', async () => {
    const fieldWithValidation: ContentTypeField = {
      contentTypeId: 'test-content-type',
      id: 'age',
      uniqueId: 'age',
      name: 'Age',
      type: 'Integer',
      required: true,
      fieldControl: { fieldId: 'age', widgetId: 'numberEditor' },
      validations: [{ range: { min: 0, max: 120 } }],
    };

    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedEntries={[entry1]}
        selectedField={fieldWithValidation}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
      />
    );

    const input = await screen.findByTestId('number-editor-input');
    fireEvent.change(input, { target: { value: '150' } });

    // Wait for debounced validation (500ms)
    await waitFor(
      () => {
        expect(screen.getByText('Must be between 0 and 120')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Save button should be disabled
    const saveButton = screen.getByTestId('bulk-edit-save');
    expect(saveButton).toBeDisabled();
  });
});
