import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkEditModal } from '../../../src/locations/Page/components/BulkEditModal';
import { ContentTypeField, Entry } from '../../../src/locations/Page/types';
import { mockSdk } from '../../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../../src/locations/Page/components/FieldEditor', () => ({
  FieldEditor: ({
    field,
    value,
    onChange,
  }: {
    field: ContentTypeField;
    value: string | number | null | { sys: { id: string } } | Array<{ sys: { id: string } }>;
    onChange: (
      value:
        | string
        | { sys: { type: 'Link'; linkType: 'Entry'; id: string } }
        | Array<{ sys: { type: 'Link'; linkType: 'Entry'; id: string } }>
    ) => void;
  }) => {
    const [selectionLabel, setSelectionLabel] = React.useState(() => {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} entries selected` : 'No content selected';
      }

      if (value && typeof value === 'object' && 'sys' in value) {
        return value.sys.id;
      }

      return 'No content selected';
    });

    const isSingleReference =
      field.type === 'Link' && field.fieldControl?.widgetId === 'entryLinkEditor';
    const isMultiReference =
      field.type === 'Array' && field.fieldControl?.widgetId === 'entryLinksEditor';

    if (isSingleReference) {
      return (
        <>
          <button
            data-test-id="reference-picker-trigger"
            onClick={async () => {
              const entry = await mockSdk.dialogs.selectSingleEntry();

              if (!entry) {
                return;
              }

              const title = entry.fields?.title?.['en-US'];
              setSelectionLabel(typeof title === 'string' ? title : entry.sys.id);
              onChange({
                sys: { type: 'Link', linkType: 'Entry', id: entry.sys.id },
              });
            }}
            type="button">
            Add existing content
          </button>
          <span>{selectionLabel}</span>
        </>
      );
    }

    if (isMultiReference) {
      return (
        <>
          <button
            data-test-id="reference-picker-trigger"
            onClick={async () => {
              const entries = await mockSdk.dialogs.selectMultipleEntries();

              if (!entries || entries.length === 0) {
                return;
              }

              setSelectionLabel(
                entries.length === 1
                  ? entries[0].fields?.title?.['en-US'] ?? entries[0].sys.id
                  : `${entries.length} entries selected`
              );
              onChange(
                entries.map((entry) => ({
                  sys: { type: 'Link', linkType: 'Entry', id: entry.sys.id },
                }))
              );
            }}
            type="button">
            Add existing content
          </button>
          <span>{selectionLabel}</span>
        </>
      );
    }

    return (
      <input
        data-test-id="number-editor-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        readOnly={false}
      />
    );
  },
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

  beforeEach(() => {
    mockSdk.dialogs.selectSingleEntry.mockReset();
    mockSdk.dialogs.selectMultipleEntries.mockReset();
    mockSdk.cma.entry.get.mockReset();
    mockSdk.cma.entry.getMany.mockReset();
  });

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
        contentTypes={[]}
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
        contentTypes={[]}
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
        contentTypes={[]}
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
        contentTypes={[]}
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
        contentTypes={[]}
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
        contentTypes={[]}
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
        contentTypes={[]}
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

  it('saves a selected single reference value', async () => {
    const onSave = vi.fn();
    const referenceField: ContentTypeField = {
      contentTypeId: 'test-content-type',
      id: 'author',
      uniqueId: 'author',
      name: 'Author',
      type: 'Link',
      required: false,
      fieldControl: { fieldId: 'author', widgetId: 'entryLinkEditor' },
      validations: [{ linkContentType: ['author'] }],
    };

    mockSdk.dialogs.selectSingleEntry.mockResolvedValue({
      sys: { id: 'author-entry-1' },
      fields: { title: { 'en-US': 'Jessie Xu' } },
    });

    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        selectedEntries={[entry1]}
        selectedField={referenceField}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
        contentTypes={[]}
      />
    );

    fireEvent.click(screen.getByTestId('reference-picker-trigger'));

    await waitFor(() => {
      expect(screen.getByText('Jessie Xu')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bulk-edit-save'));

    expect(onSave).toHaveBeenCalledWith({
      sys: { type: 'Link', linkType: 'Entry', id: 'author-entry-1' },
    });
  });

  it('displays the linked entry title for an existing reference value', async () => {
    const referenceField: ContentTypeField = {
      contentTypeId: 'test-content-type',
      id: 'author',
      uniqueId: 'author',
      name: 'Author',
      type: 'Link',
      required: false,
      fieldControl: { fieldId: 'author', widgetId: 'entryLinkEditor' },
      validations: [{ linkContentType: ['author'] }],
    };
    const entryWithAuthor: Entry = {
      sys: { id: '3', contentType: { sys: { id: 'condoA' } }, version: 1 },
      fields: {
        displayName: { 'en-US': 'Building three' },
        author: {
          'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'author-entry-1' } },
        },
      },
    };

    mockSdk.cma.entry.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'author-entry-1', contentType: { sys: { id: 'author' } } },
          fields: { title: { 'en-US': 'Jessie Xu' } },
        },
      ],
    });

    const authorContentType = {
      sys: { id: 'author' },
      displayField: 'title',
      name: 'Author',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [],
        },
      ],
    } as any;

    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedEntries={[entryWithAuthor]}
        selectedField={referenceField}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
        contentTypes={[authorContentType]}
      />
    );

    expect(await screen.findByText('Jessie Xu')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
  });

  it('saves selected multi-reference values', async () => {
    const onSave = vi.fn();
    const multiReferenceField: ContentTypeField = {
      contentTypeId: 'test-content-type',
      id: 'authors',
      uniqueId: 'authors',
      name: 'Authors',
      type: 'Array',
      required: false,
      fieldControl: { fieldId: 'authors', widgetId: 'entryLinksEditor' },
      validations: [],
      items: {
        type: 'Link',
        linkType: 'Entry',
        validations: [{ linkContentType: ['author'] }],
      },
    };

    mockSdk.dialogs.selectMultipleEntries.mockResolvedValue([
      { sys: { id: 'author-entry-1' }, fields: { title: { 'en-US': 'Jessie Xu' } } },
      { sys: { id: 'author-entry-2' }, fields: { title: { 'en-US': 'Neha Khawas' } } },
    ]);

    render(
      <BulkEditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        selectedEntries={[entry1]}
        selectedField={multiReferenceField}
        locales={mockSdk.locales}
        isSaving={false}
        totalUpdateCount={0}
        editionCount={0}
        contentTypes={[]}
      />
    );

    fireEvent.click(screen.getByTestId('reference-picker-trigger'));

    await waitFor(() => {
      expect(screen.getByText('2 entries selected')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bulk-edit-save'));

    expect(onSave).toHaveBeenCalledWith([
      { sys: { type: 'Link', linkType: 'Entry', id: 'author-entry-1' } },
      { sys: { type: 'Link', linkType: 'Entry', id: 'author-entry-2' } },
    ]);
  });
});
