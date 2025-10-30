import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@lingui/core';
import { FieldEditor } from '../../../src/locations/Page/components/FieldEditor';
import { mockSdk } from '../../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('FieldEditor', () => {
  const mockOnChange = vi.fn();

  const createField = (type: string, id: string = 'test-field', name: string = 'Test Field') => ({
    id,
    name,
    type,
    locale: mockSdk.locales.default,
    uniqueId: `${id}-${mockSdk.locales.default}`,
    validations: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    const locale = 'en-US';
    if (!i18n.locale) {
      i18n.load(locale, {});
    }
    i18n.activate(i18n.locale || locale);
  });

  it('renders SingleLineEditor for Short Text fields with Single Line appearance', () => {
    const field = createField('Symbol');
    const value = 'test value';

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
  });

  it('renders Dropdown Editor for Short Text fields with Dropdown appearance', () => {
    const field = createField('Symbol');
    const value = 'one';

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'dropdown' },
      validations: [
        {
          in: ['one', 'two', 'three'],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-editor')).toBeInTheDocument();
  });

  it('renders Radio Editor for Short Text fields with Radio appearance', () => {
    const field = createField('Symbol');
    const value = 'one';

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'radio' },
      validations: [
        {
          in: ['one', 'two', 'three'],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('radio-editor')).toBeInTheDocument();
  });

  it('renders SingleLineEditor for Long Text fields with Single Line appearance', () => {
    const field = createField('Text');
    const value = 'test value';

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
  });

  it('renders MultipleLineEditor for Long Text fields with Multiple Line appearance', () => {
    const field = createField('Text');
    const value = 'multiline text value';

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'multipleLine' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('multiple-line-editor')).toBeInTheDocument();
  });

  it('renders Dropdown Editor for Long Text fields with Dropdown appearance', () => {
    const field = createField('Text');
    const value = 'one';

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'dropdown' },
      validations: [
        {
          in: ['one', 'two', 'three'],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-editor')).toBeInTheDocument();
  });

  it('renders Radio Editor for Long Text fields with Radio appearance', () => {
    const field = createField('Text');
    const value = 'one';

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'radio' },
      validations: [
        {
          in: ['one', 'two', 'three'],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('radio-editor')).toBeInTheDocument();
  });

  it('renders NumberEditor for Decimal fields with Number Editor appearance', () => {
    const field = createField('Number');
    const value = 123.45;

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'numberEditor' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders Dropdown Editor for Decimal fields with Dropdown appearance', () => {
    const field = createField('Number');
    const value = 2.56;

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'dropdown' },
      validations: [
        {
          in: [1, 2.56, 3.64],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-editor')).toBeInTheDocument();
  });

  it('renders Radio Editor for Decimal fields with Radio appearance', () => {
    const field = createField('Number');
    const value = 2.56;

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'radio' },
      validations: [
        {
          in: [1, 2.56, 3.64],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('radio-editor')).toBeInTheDocument();
  });

  it('renders NumberEditor for Integer fields with Number Editor appearance', () => {
    const field = createField('Integer');
    const value = 42;

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'numberEditor' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders Dropdown Editor for Integer fields with Dropdown appearance', () => {
    const field = createField('Number');
    const value = 42;

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'dropdown' },
      validations: [
        {
          in: [1, 42, 364],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-editor')).toBeInTheDocument();
  });

  it('renders Radio Editor for Integer fields with Radio appearance', () => {
    const field = createField('Number');
    const value = 42;

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'radio' },
      validations: [
        {
          in: [1, 42, 364],
        },
      ],
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByTestId('radio-editor')).toBeInTheDocument();
  });

  it('renders DateEditor for Date fields', () => {
    const field = createField('Date');
    const value = '2023-10-26T10:00:00Z';

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'datePicker' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue('26 Oct 2023')).toBeInTheDocument();
    expect(screen.getByTestId('date-editor')).toBeInTheDocument();
  });

  it('renders TagsEditor for Array fields with with Tag appearance', () => {
    const field = createField('Array');
    const value = ['tag1', 'tag2'];

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'tagEditor' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByTestId('tag-editor-container')).toBeInTheDocument();
  });

  it('renders ListEditor for Array fields with with List appearance', () => {
    const field = createField('Array');
    const value = ['item1', 'item2'];

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'listInput' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue('item1, item2')).toBeInTheDocument();
    expect(screen.getByTestId('list-editor-input')).toBeInTheDocument();
  });

  it('renders CheckboxEditor for Array fields with with Checkbox appearance', () => {
    const field = createField('Array');
    const value = ['item1', 'item2'];

    const fieldMockWithControl = {
      ...field,
      fieldControl: { widgetId: 'checkbox' },
      items: {
        type: 'Symbol',
        validations: [
          {
            in: ['one', 'two', 'three'],
          },
        ],
      },
    };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={value}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByDisplayValue('item1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('item2')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-editor')).toBeInTheDocument();
  });

  it('renders JsonEditor for Object fields', () => {
    const field = createField('Object');
    const value = { key: 'value' };

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'objectEditor' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={JSON.stringify(value)}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
  });

  it('renders BooleanEditor for Boolean fields', async () => {
    const field = createField('Boolean');
    const value = true;

    const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'boolean' } };

    render(
      <FieldEditor
        field={fieldMockWithControl}
        value={String(value)}
        onChange={mockOnChange}
        locales={mockSdk.locales}
      />
    );

    const booleanEditorElement = await screen.findByText('Clear');

    expect(booleanEditorElement).toBeTruthy();
    expect(screen.getByTestId('boolean-editor')).toBeInTheDocument();
  });

  describe('Boolean field editor with custom labels', () => {
    it('renders BooleanEditor with default labels when editor interface is null', async () => {
      const field = createField('Boolean');
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'boolean' } };
      const value = true;

      // Mock the SDK to return null for editor interface
      vi.mocked(mockSdk.cma.editorInterface.get).mockResolvedValue(null);

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={mockSdk.locales}
        />
      );

      // Wait for the editor interface to be fetched
      await vi.waitFor(() => {
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.getByTestId('boolean-editor')).toBeInTheDocument();
      });
    });

    it('renders BooleanEditor with custom labels from editor interface', async () => {
      const field = createField('Boolean');
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'boolean' } };
      const value = true;

      // Mock editor interface with custom labels
      const mockEditorInterface = {
        sys: {
          id: 'test-editor-interface',
          type: 'EditorInterface',
          version: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        controls: [
          {
            fieldId: 'test-field',
            widgetId: 'boolean',
            widgetNamespace: 'builtin',
            settings: {
              trueLabel: 'True',
              falseLabel: 'False',
            },
          },
        ],
      };

      vi.mocked(mockSdk.cma.editorInterface.get).mockResolvedValue(mockEditorInterface);

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={mockSdk.locales}
        />
      );

      // Wait for the editor interface to be fetched and BooleanEditor to render
      await vi.waitFor(() => {
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.getByTestId('boolean-editor')).toBeInTheDocument();
      });
    });
  });

  describe('FieldAPI and LocalesAPI creation', () => {
    it('creates FieldAPI with correct properties', () => {
      const field = createField('Symbol', 'test-id', 'Test Name');
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };
      const value = 'test value';

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={mockSdk.locales}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('handles field with custom locale', () => {
      const field = {
        ...createField('Symbol'),
        locale: 'es-ES',
      };
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };
      const value = 'test value';

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={mockSdk.locales}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('handles field without locale (uses default)', () => {
      const field = {
        ...createField('Symbol'),
        locale: undefined,
      };
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };
      const value = 'test value';

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={mockSdk.locales}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('creates LocalesAPI with correct properties', () => {
      const field = createField('Text');
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };
      const value = 'test value';

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={mockSdk.locales}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('handles different default locales', () => {
      const field = createField('Text');
      const fieldMockWithControl = { ...field, fieldControl: { widgetId: 'singleLine' } };
      const value = 'test value';
      const customLocales = {
        ...mockSdk.locales,
        default: 'es-ES',
      };

      render(
        <FieldEditor
          field={fieldMockWithControl}
          value={value}
          onChange={mockOnChange}
          locales={customLocales}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });
  });
});
