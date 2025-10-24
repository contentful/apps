import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BulkEditModal } from '../../../src/locations/Page/components/BulkEditModal';
import { ContentTypeField, Entry } from '../../../src/locations/Page/types';
import { mockSdk } from '../../mocks';
import { createField } from '../../utils/testHelpers';

describe('BulkEditModal', () => {
  const field: ContentTypeField = { id: 'size', uniqueId: 'size', name: 'Size', type: 'Number' };
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

  describe('Field validations', () => {
    it('shows validation message for empty Boolean field in modal', async () => {
      const booleanField = createField('Boolean', 'isActive', 'Is Active');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={booleanField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('shows validation message for empty Symbol field in modal', async () => {
      const symbolField = createField('Symbol', 'title', 'Title');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={symbolField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('shows validation message for empty Number field in modal', async () => {
      const numberField = createField('Number', 'price', 'Price');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={numberField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('shows validation message for empty JSON field in modal', async () => {
      const jsonField = createField('Object', 'metadata', 'Metadata');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={jsonField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('shows validation message for empty Array field in modal', async () => {
      const arrayField = createField('Array', 'tags', 'Tags');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={arrayField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('disables Save button when validation errors are present', async () => {
      const booleanField = createField('Boolean', 'isActive', 'Is Active');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={booleanField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
        expect(screen.getByTestId('bulk-edit-save')).toBeDisabled();
      });
    });

    it('enables Save button when validation errors are resolved', async () => {
      const symbolField = createField('Symbol', 'title', 'Title');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={symbolField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('bulk-edit-save')).toBeDisabled();
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Test Title' } });

      await waitFor(() => {
        expect(screen.getByTestId('bulk-edit-save')).not.toBeDisabled();
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      });
    });

    it('clears validation message when field gets a value', async () => {
      const numberField = createField('Number', 'price', 'Price');

      render(
        <BulkEditModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          selectedEntries={[entry1]}
          selectedField={numberField}
          locales={mockSdk.locales}
          isSaving={false}
          totalUpdateCount={0}
          editionCount={0}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      const input = await screen.findByTestId('number-editor-input');
      fireEvent.change(input, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      });
    });
  });
});
