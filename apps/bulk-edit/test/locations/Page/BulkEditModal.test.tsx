import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
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
});
