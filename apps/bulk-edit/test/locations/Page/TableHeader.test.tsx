import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableHeader } from '../../../src/locations/Page/components/TableHeader';
import { ContentTypeField } from '../../../src/locations/Page/types';

// Mock the Contentful components
vi.mock('@contentful/f36-components', () => ({
  Table: {
    Head: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
    Row: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    Cell: ({ children, as, style, onFocus, onBlur, tabIndex, ...props }: any) => {
      const Component = as || 'td';
      return (
        <Component {...props} style={style} onFocus={onFocus} onBlur={onBlur} tabIndex={tabIndex}>
          {children}
        </Component>
      );
    },
  },
  Checkbox: ({
    isChecked,
    isDisabled,
    onChange,
    testId,
    'aria-label': ariaLabel,
    ...props
  }: any) => (
    <input
      type="checkbox"
      checked={isChecked}
      disabled={isDisabled}
      onChange={onChange}
      data-testid={testId}
      aria-label={ariaLabel}
      {...props}
    />
  ),
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@contentful/f36-tooltip', () => ({
  Tooltip: ({ children, content, placement }: any) => (
    <div title={content} data-placement={placement}>
      {children}
    </div>
  ),
}));

vi.mock('@phosphor-icons/react', () => ({
  QuestionIcon: ({ size, 'aria-label': ariaLabel }: any) => (
    <span data-testid="question-icon" data-size={size} aria-label={ariaLabel}>
      ?
    </span>
  ),
}));

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

const defaultProps = {
  fields: [mockField],
  headerCheckboxes: { field1: false },
  onHeaderCheckboxChange: vi.fn(),
  checkboxesDisabled: { field1: false },
  onCellFocus: vi.fn(),
};

describe('TableHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all header cells', () => {
    render(<TableHeader {...defaultProps} />);

    expect(screen.getByText('Display name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Test Field')).toBeInTheDocument();
  });

  it('applies focused styling when header text is focused', () => {
    render(<TableHeader {...defaultProps} />);

    const displayNameText = screen.getByText('Display name');
    expect(displayNameText).toBeInTheDocument();

    fireEvent.focus(displayNameText);

    // Check that the focused styling is applied (blue border)
    expect(displayNameText).toHaveStyle('border: 2px solid rgb(152, 203, 255)');
    expect(displayNameText).toHaveStyle('outline: none');
    expect(displayNameText).toHaveStyle('border-radius: 4px');
  });

  it('removes focused styling when header text loses focus', () => {
    render(<TableHeader {...defaultProps} />);

    const displayNameText = screen.getByText('Display name');
    expect(displayNameText).toBeInTheDocument();

    fireEvent.focus(displayNameText);
    expect(displayNameText).toHaveStyle('border: 2px solid rgb(152, 203, 255)');

    fireEvent.blur(displayNameText);
    // The focused styling should be removed
    expect(displayNameText).not.toHaveStyle('border: 2px solid rgb(152, 203, 255)');
  });

  it('calls onCellFocus when header text is focused', () => {
    const mockOnCellFocus = vi.fn();
    render(<TableHeader {...defaultProps} onCellFocus={mockOnCellFocus} />);

    const displayNameText = screen.getByText('Display name');
    fireEvent.focus(displayNameText);

    expect(mockOnCellFocus).toHaveBeenCalledWith(0, 0); // row 0, column 0
  });

  it('sets tabIndex to 0 for all header text elements', () => {
    render(<TableHeader {...defaultProps} />);

    const headerTexts = [
      screen.getByText('Display name'),
      screen.getByText('Status'),
      screen.getByText('Test Field'),
    ];

    headerTexts.forEach((text) => {
      expect(text).toHaveAttribute('tabIndex', '0');
    });
  });

  it('applies focused styling to status header when focused', () => {
    render(<TableHeader {...defaultProps} />);

    const statusText = screen.getByText('Status');
    expect(statusText).toBeInTheDocument();

    fireEvent.focus(statusText);
    expect(statusText).toHaveStyle('border: 2px solid rgb(152, 203, 255)');
  });

  it('applies focused styling to field header when focused', () => {
    render(<TableHeader {...defaultProps} />);

    const fieldText = screen.getByText('Test Field');
    expect(fieldText).toBeInTheDocument();

    fireEvent.focus(fieldText);
    expect(fieldText).toHaveStyle('border: 2px solid rgb(152, 203, 255)');
  });

  it('only shows focused styling on the currently focused header', () => {
    render(<TableHeader {...defaultProps} />);

    const displayNameText = screen.getByText('Display name');
    const statusText = screen.getByText('Status');

    // Focus on display name text
    fireEvent.focus(displayNameText);
    expect(displayNameText).toHaveStyle('border: 2px solid rgb(152, 203, 255)');
    expect(statusText).not.toHaveStyle('border: 2px solid rgb(152, 203, 255)');

    // Focus on status text
    fireEvent.focus(statusText);
    expect(statusText).toHaveStyle('border: 2px solid rgb(152, 203, 255)');
    expect(displayNameText).not.toHaveStyle('border: 2px solid rgb(152, 203, 255)');
  });
});
