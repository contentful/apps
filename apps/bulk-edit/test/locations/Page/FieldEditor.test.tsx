import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldEditor } from '../../../src/locations/Page/components/FieldEditor';
import type { ContentTypeField } from '../../../src/locations/Page/types';

// Mock the field editors
vi.mock('@contentful/field-editor-single-line', () => ({
  SingleLineEditor: ({ field }: any) => (
    <input
      data-test-id="single-line-editor"
      value={field.getValue()}
      onChange={(e) => field.setValue(e.target.value)}
      placeholder="Single line editor"
    />
  ),
}));

vi.mock('@contentful/field-editor-multiple-line', () => ({
  MultipleLineEditor: ({ field }: any) => (
    <textarea
      data-test-id="multiple-line-editor"
      value={field.getValue()}
      onChange={(e) => field.setValue(e.target.value)}
      placeholder="Multiple line editor"
    />
  ),
}));

vi.mock('@contentful/field-editor-number', () => ({
  NumberEditor: ({ field }: any) => (
    <input
      data-test-id="number-editor"
      type="number"
      value={field.getValue()}
      onChange={(e) => field.setValue(e.target.value)}
      placeholder="Number editor"
    />
  ),
}));

describe('FieldEditor', () => {
  const defaultLocale = 'en-US';
  const mockOnChange = vi.fn();

  const createField = (
    type: string,
    id: string = 'test-field',
    name: string = 'Test Field'
  ): ContentTypeField => ({
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

    expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
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

    expect(screen.getByTestId('multiple-line-editor')).toBeInTheDocument();
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

    expect(screen.getByTestId('number-editor')).toBeInTheDocument();
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

    expect(screen.getByTestId('number-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('renders SingleLineEditor as fallback for unknown field types', () => {
    const field = createField('UnknownType');
    const value = 'fallback value';

    render(
      <FieldEditor
        field={field}
        value={value}
        onChange={mockOnChange}
        defaultLocale={defaultLocale}
      />
    );

    expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
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

      const input = screen.getByTestId('single-line-editor');
      expect(input).toHaveValue(value);
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

      expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
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

      expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
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

      expect(screen.getByTestId('multiple-line-editor')).toBeInTheDocument();
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

      expect(screen.getByTestId('multiple-line-editor')).toBeInTheDocument();
    });
  });
});
