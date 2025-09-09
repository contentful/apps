import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTableCellFocus } from '../../../../src/locations/Page/hooks/useTableCellFocus';
import { ContentTypeField } from '../../../../src/locations/Page/types';

const mockField: ContentTypeField = {
  uniqueId: 'field1',
  name: 'Test Field',
  type: 'Text',
  required: false,
  localized: false,
  disabled: false,
  omitted: false,
  validations: [],
  items: null,
  linkType: null,
  allowedResources: null,
  allowedResourceTypes: null,
  linkMimetypeGroup: null,
  in: null,
  notIn: null,
  size: null,
  precision: null,
  min: null,
  max: null,
  regexp: null,
  message: null,
  assetImageDimensions: null,
  assetFileSize: null,
  value: null,
  reference: null,
  references: null,
  link: null,
  links: null,
  locale: null,
};

describe('useTableCellFocus', () => {
  const mockOnCellFocus = vi.fn();
  const mockOnRegisterFocusableElement = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useTableCellFocus({
        fields: [mockField],
        rowIndex: 1,
        onCellFocus: mockOnCellFocus,
        onRegisterFocusableElement: mockOnRegisterFocusableElement,
      })
    );

    expect(result.current.focusedColumn).toBeNull();
    expect(result.current.displayNameRef).toBeDefined();
    expect(result.current.statusRef).toBeDefined();
    expect(result.current.fieldRefs).toBeDefined();
    expect(result.current.checkboxRefs).toBeDefined();
    expect(typeof result.current.handleCellFocus).toBe('function');
    expect(typeof result.current.handleCellBlur).toBe('function');
    expect(typeof result.current.getTextStyle).toBe('function');
    expect(typeof result.current.getCheckboxStyle).toBe('function');
  });

  it('should call onCellFocus when handleCellFocus is called', () => {
    const { result } = renderHook(() =>
      useTableCellFocus({
        fields: [mockField],
        rowIndex: 1,
        onCellFocus: mockOnCellFocus,
        onRegisterFocusableElement: mockOnRegisterFocusableElement,
      })
    );

    result.current.handleCellFocus(2);

    expect(mockOnCellFocus).toHaveBeenCalledWith(1, 2);
  });

  it('should return correct styles when focused', () => {
    const { result, rerender } = renderHook(() =>
      useTableCellFocus({
        fields: [mockField],
        rowIndex: 1,
        onCellFocus: mockOnCellFocus,
        onRegisterFocusableElement: mockOnRegisterFocusableElement,
      })
    );

    // Initially no focus
    expect(result.current.getTextStyle(0)).toEqual({});
    expect(result.current.getCheckboxStyle(0)).toEqual({});

    // Focus on column 0
    result.current.handleCellFocus(0);
    rerender(); // Trigger re-render to update state

    // Should return focused styles
    expect(result.current.getTextStyle(0)).toHaveProperty('border');
    expect(result.current.getCheckboxStyle(0)).toHaveProperty('border');
    expect(result.current.getTextStyle(1)).toEqual({});
  });

  it('should clear focus when handleCellBlur is called', () => {
    const { result, rerender } = renderHook(() =>
      useTableCellFocus({
        fields: [mockField],
        rowIndex: 1,
        onCellFocus: mockOnCellFocus,
        onRegisterFocusableElement: mockOnRegisterFocusableElement,
      })
    );

    // Focus first
    result.current.handleCellFocus(0);
    rerender(); // Trigger re-render to update state
    expect(result.current.getTextStyle(0)).toHaveProperty('border');

    // Then blur
    result.current.handleCellBlur();
    rerender(); // Trigger re-render to update state
    expect(result.current.getTextStyle(0)).toEqual({});
  });
});
