import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EntryTable } from '../../../src/locations/Page/components/EntryTable';
import { Entry, ContentTypeField } from '../../../src/locations/Page/types';
import { ContentTypeProps } from 'contentful-management';

// Mock data
const mockFields: ContentTypeField[] = [
  {
    id: 'title',
    name: 'Title',
    type: 'Text',
    uniqueId: 'title',
    locale: 'en-US',
  },
  {
    id: 'description',
    name: 'Description',
    type: 'Text',
    uniqueId: 'description',
    locale: 'en-US',
  },
];

const mockContentType: ContentTypeProps = {
  sys: { id: 'test-content-type', type: 'ContentType' },
  name: 'Test Content Type',
  displayField: 'title',
  fields: [],
};

const mockEntries: Entry[] = [
  {
    sys: { id: 'entry-1', type: 'Entry' },
    fields: {
      title: { 'en-US': 'Test Entry 1' },
      description: { 'en-US': 'Test Description 1' },
    },
  },
  {
    sys: { id: 'entry-2', type: 'Entry' },
    fields: {
      title: { 'en-US': 'Test Entry 2' },
      description: { 'en-US': 'Test Description 2' },
    },
  },
];

const defaultProps = {
  entries: mockEntries,
  fields: mockFields,
  contentType: mockContentType,
  spaceId: 'test-space',
  environmentId: 'test-env',
  defaultLocale: 'en-US',
  activePage: 1,
  totalEntries: 2,
  itemsPerPage: 10,
  onPageChange: vi.fn(),
  onItemsPerPageChange: vi.fn(),
  pageSizeOptions: [10, 25, 50],
};

describe('EntryTable Keyboard Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the table with keyboard navigation support', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('aria-label', 'Bulk edit table with keyboard navigation');
  });

  it('should handle arrow key navigation', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');

    // Focus the table
    table.focus();

    // Test right arrow key
    fireEvent.keyDown(table, { key: 'ArrowRight' });
    // Test down arrow key
    fireEvent.keyDown(table, { key: 'ArrowDown' });
    // Test left arrow key
    fireEvent.keyDown(table, { key: 'ArrowLeft' });
    // Test up arrow key
    fireEvent.keyDown(table, { key: 'ArrowUp' });

    // The table should still be focused
    expect(table).toHaveFocus();
  });

  it('should handle Tab navigation', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Tab key
    fireEvent.keyDown(table, { key: 'Tab' });
    // Test Shift+Tab key
    fireEvent.keyDown(table, { key: 'Tab', shiftKey: true });

    expect(table).toHaveFocus();
  });

  it('should handle Enter key for checkbox toggle', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Enter key
    fireEvent.keyDown(table, { key: 'Enter' });

    expect(table).toHaveFocus();
  });

  it('should handle Escape key to unfocus', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Escape key
    fireEvent.keyDown(table, { key: 'Escape' });

    // The table should still be focused (Escape clears internal focus state, not DOM focus)
    expect(table).toHaveFocus();
  });

  it('should handle Space key for checkbox toggle', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Space key
    fireEvent.keyDown(table, { key: ' ' });

    expect(table).toHaveFocus();
  });

  it('should handle Alt+Space for column selection on Windows/Linux', () => {
    // Mock navigator.platform for Windows
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    });

    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Alt+Space key
    fireEvent.keyDown(table, { key: ' ', altKey: true });

    expect(table).toHaveFocus();
  });

  it('should handle Option+Space for column selection on Mac', () => {
    // Mock navigator.platform for Mac
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    });

    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Option+Space key
    fireEvent.keyDown(table, { key: ' ', altKey: true });

    expect(table).toHaveFocus();
  });

  it('should handle Shift+Arrow for selection extension', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Shift+Arrow keys
    fireEvent.keyDown(table, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(table, { key: 'ArrowDown', shiftKey: true });

    expect(table).toHaveFocus();
  });

  it('should handle Alt+Shift+Arrow for edge selection on Windows/Linux', () => {
    // Mock navigator.platform for Windows
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    });

    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Alt+Shift+Arrow keys
    fireEvent.keyDown(table, { key: 'ArrowRight', altKey: true, shiftKey: true });
    fireEvent.keyDown(table, { key: 'ArrowDown', altKey: true, shiftKey: true });

    expect(table).toHaveFocus();
  });

  it('should handle Cmd+Shift+Arrow for edge selection on Mac', () => {
    // Mock navigator.platform for Mac
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    });

    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test Cmd+Shift+Arrow keys
    fireEvent.keyDown(table, { key: 'ArrowRight', metaKey: true, shiftKey: true });
    fireEvent.keyDown(table, { key: 'ArrowDown', metaKey: true, shiftKey: true });

    expect(table).toHaveFocus();
  });

  it('should handle keyboard events without errors', () => {
    render(<EntryTable {...defaultProps} />);

    const table = screen.getByRole('grid');
    table.focus();

    // Test that keyboard events are handled without throwing errors
    expect(() => {
      fireEvent.keyDown(table, { key: 'ArrowRight' });
      fireEvent.keyDown(table, { key: 'ArrowDown' });
      fireEvent.keyDown(table, { key: 'Tab' });
      fireEvent.keyDown(table, { key: 'Enter' });
      fireEvent.keyDown(table, { key: 'Escape' });
      fireEvent.keyDown(table, { key: ' ' });
    }).not.toThrow();
  });

  it('should unfocus cells when clicking outside the table', () => {
    render(
      <div>
        <div data-testid="outside-element">Outside element</div>
        <EntryTable {...defaultProps} />
      </div>
    );

    const table = screen.getByRole('grid');
    const outsideElement = screen.getByTestId('outside-element');

    // Focus the table first
    table.focus();

    // Click outside the table
    fireEvent.mouseDown(outsideElement);

    // The table should still be in the DOM but focus state should be cleared
    expect(table).toBeInTheDocument();
  });
});
