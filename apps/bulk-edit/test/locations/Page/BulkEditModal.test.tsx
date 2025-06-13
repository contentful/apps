import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BulkEditModal } from '../../../src/locations/Page/components/BulkEditModal';
import { Entry, ContentTypeField } from '../../../src/locations/Page/types';
import { ContentTypeProps } from 'contentful-management';

describe('BulkEditModal', () => {
  const field: ContentTypeField = { id: 'size', uniqueId: 'size', name: 'Size', type: 'Number' };
  const displayNameField: ContentTypeField = {
    id: 'displayName',
    uniqueId: 'displayName',
    name: 'Display Name',
    type: 'Symbol',
  };
  const fields: ContentTypeField[] = [displayNameField, field];
  const contentType: Partial<ContentTypeProps> = { displayField: 'displayName' };
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
        defaultLocale="en-US"
        isSaving={false}
      />
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your new value')).toBeInTheDocument();
  });

  it('renders correct subtitle for multiple entries', () => {
    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedEntries={[entry1, entry2]}
        selectedField={field}
        defaultLocale="en-US"
        isSaving={false}
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
        defaultLocale="en-US"
        isSaving={false}
      />
    );
    fireEvent.click(screen.getByTestId('bulk-edit-cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with value when Save is clicked', () => {
    const onSave = vi.fn();
    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        selectedEntries={[entry1]}
        selectedField={field}
        defaultLocale="en-US"
        isSaving={false}
      />
    );
    const input = screen.getByPlaceholderText('Enter your new value');
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.click(screen.getByTestId('bulk-edit-save'));
    expect(onSave).toHaveBeenCalledWith(1234);
  });

  it('shows validation message for decimal in integer field', () => {
    const integerField: ContentTypeField = {
      id: 'count',
      uniqueId: 'count',
      name: 'Count',
      type: 'Integer',
    };
    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedEntries={[entry1]}
        selectedField={integerField}
        fields={fields}
        defaultLocale="en-US"
        isSaving={false}
      />
    );
    const input = screen.getByPlaceholderText('Enter your new value');
    fireEvent.change(input, { target: { value: '1.5' } });
    expect(screen.getByText('Integer field does not allow decimal')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-edit-save')).toBeDisabled();
  });
});
