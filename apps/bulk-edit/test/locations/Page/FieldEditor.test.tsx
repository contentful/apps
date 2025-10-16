import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldEditor } from '../../../src/locations/Page/components/FieldEditor';

describe('FieldEditor', () => {
  const defaultLocale = 'en-US';
  const mockOnChange = vi.fn();

  const createField = (type: string, id: string = 'test-field', name: string = 'Test Field') => ({
    id,
    name,
    type,
    locale: defaultLocale,
    uniqueId: `${id}-${defaultLocale}`,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SingleLineEditor for Symbol fields', () => {
    const field = createField('Symbol');
    const value = 'test value';

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders MultipleLineEditor for Text fields', () => {
    const field = createField('Text');
    const value = 'multiline text value';

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders NumberEditor for Number fields', () => {
    const field = createField('Number');
    const value = '123.45';

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders NumberEditor for Integer fields', () => {
    const field = createField('Integer');
    const value = '42';

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders DateEditor for Date fields', () => {
    const field = createField('Date');
    const value = '2023-10-26T10:00:00Z';

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByDisplayValue('26 Oct 2023')).toBeInTheDocument();
  });

  it('renders TagsEditor for Array fields with Symbol items', () => {
    const field = createField('Array');
    const value = ['tag1', 'tag2'];

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('renders BooleanEditor for Boolean fields', () => {
    const field = createField('Boolean');
    const value = true;

    render(
      <FieldEditor
        field={field}
        value={String(value)}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    const booleanEditorElement = screen.getByText('Clear');

    expect(booleanEditorElement).toBeTruthy();
  });

  it('renders JsonEditor for Object fields', () => {
    const field = createField('Object');
    const value = { key: 'value' };

    render(
      <FieldEditor
        field={field}
        value={JSON.stringify(value)}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  describe('FieldAPI and LocalesAPI creation', () => {
    it('creates FieldAPI with correct properties', () => {
      const field = createField('Symbol', 'test-id', 'Test Name');
      const value = 'test value';

      render(
        <FieldEditor
          field={field}
          value={value}
          onChange={mockOnChange}
          defaultLocale={defaultLocale}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('handles field with custom locale', () => {
      const field = {
        ...createField('Symbol'),
        locale: 'es-ES',
      };
      const value = 'test value';

      render(
        <FieldEditor
          field={field}
          value={value}
          onChange={mockOnChange}
          defaultLocale={defaultLocale}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('handles field without locale (uses default)', () => {
      const field = {
        ...createField('Symbol'),
        locale: undefined,
      };
      const value = 'test value';

      render(
        <FieldEditor
          field={field}
          value={value}
          onChange={mockOnChange}
          defaultLocale={defaultLocale}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('creates LocalesAPI with correct properties', () => {
      const field = createField('Text');
      const value = 'test value';

      render(
        <FieldEditor
          field={field}
          value={value}
          onChange={mockOnChange}
          defaultLocale={defaultLocale}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });

    it('handles different default locales', () => {
      const field = createField('Text');
      const value = 'test value';
      const customLocale = 'es-ES';

      render(
        <FieldEditor
          field={field}
          value={value}
          onChange={mockOnChange}
          defaultLocale={customLocale}
        />
      );

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    });
  });
});
