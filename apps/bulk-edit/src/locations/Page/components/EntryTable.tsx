import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Table, Box, Pagination } from '@contentful/f36-components';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { isCheckboxAllowed as isBulkEditable } from '../utils/entryUtils';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from '../utils/constants';

interface EntryTableProps {
  entries: Entry[];
  fields: ContentTypeField[];
  contentType: ContentTypeProps;
  spaceId: string;
  environmentId: string;
  defaultLocale: string;
  activePage: number;
  totalEntries: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions: number[];
  onSelectionChange?: (selection: {
    selectedEntryIds: string[];
    selectedFieldId: string | null;
  }) => void;
}

interface FocusPosition {
  row: number; // -1 for header, 0+ for data rows
  column: number;
}

interface SelectionRange {
  start: FocusPosition;
  end: FocusPosition;
}

function getColumnIds(fields: ContentTypeField[]): string[] {
  return [DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN, ...fields.map((field) => field.uniqueId)];
}

function getBulkEditableColumns(fields: ContentTypeField[]): Record<string, boolean> {
  const bulkEditableColumns = fields.map((field) => {
    return [field.uniqueId, isBulkEditable(field)];
  });

  return {
    [DISPLAY_NAME_COLUMN]: false,
    [ENTRY_STATUS_COLUMN]: false,
    ...Object.fromEntries(bulkEditableColumns),
  };
}

function getInitialCheckboxState(columnIds: string[]): Record<string, boolean> {
  return Object.fromEntries(columnIds.map((columnId) => [columnId, false]));
}

function getInitialRowCheckboxState(
  entries: Entry[],
  columnIds: string[]
): Record<string, Record<string, boolean>> {
  const entryCheckboxStates: Record<string, Record<string, boolean>> = {};
  entries.forEach((entry) => {
    entryCheckboxStates[entry.sys.id] = getInitialCheckboxState(columnIds);
  });
  return entryCheckboxStates;
}

export const EntryTable: React.FC<EntryTableProps> = ({
  entries,
  fields,
  contentType,
  spaceId,
  environmentId,
  defaultLocale,
  activePage,
  totalEntries,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions,
  onSelectionChange,
}) => {
  const columnIds = getColumnIds(fields);
  const allowedColumns = getBulkEditableColumns(fields);
  const tableRef = useRef<HTMLTableElement>(null);

  const [headerCheckboxes, setHeaderCheckboxes] = useState<Record<string, boolean>>(
    getInitialCheckboxState(columnIds)
  );

  const [rowCheckboxes, setRowCheckboxes] = useState<Record<string, Record<string, boolean>>>(
    getInitialRowCheckboxState(entries, columnIds)
  );

  // Focus and selection state
  const [focusedCell, setFocusedCell] = useState<FocusPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Helper functions for keyboard navigation
  const getTotalRows = useCallback(() => {
    return entries.length + 1; // +1 for header row
  }, [entries.length]);

  const getTotalColumns = useCallback(() => {
    return columnIds.length;
  }, [columnIds.length]);

  const isValidPosition = useCallback(
    (position: FocusPosition) => {
      return (
        position.row >= -1 &&
        position.row < entries.length &&
        position.column >= 0 &&
        position.column < getTotalColumns()
      );
    },
    [entries.length, getTotalColumns]
  );

  const getColumnId = useCallback(
    (columnIndex: number) => {
      return columnIds[columnIndex];
    },
    [columnIds]
  );

  const isBulkEditableColumn = useCallback(
    (columnIndex: number) => {
      const columnId = getColumnId(columnIndex);
      return allowedColumns[columnId] || false;
    },
    [getColumnId, allowedColumns]
  );

  const getEntryId = useCallback(
    (rowIndex: number) => {
      if (rowIndex < 0 || rowIndex >= entries.length) return null;
      return entries[rowIndex].sys.id;
    },
    [entries]
  );

  // Keyboard navigation functions
  const moveFocus = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', extendSelection = false) => {
      if (!focusedCell) return;

      let newPosition = { ...focusedCell };

      switch (direction) {
        case 'up':
          newPosition.row = Math.max(-1, focusedCell.row - 1);
          break;
        case 'down':
          newPosition.row = Math.min(entries.length - 1, focusedCell.row + 1);
          break;
        case 'left':
          newPosition.column = Math.max(0, focusedCell.column - 1);
          break;
        case 'right':
          newPosition.column = Math.min(getTotalColumns() - 1, focusedCell.column + 1);
          break;
      }

      if (isValidPosition(newPosition)) {
        if (extendSelection) {
          if (!isSelecting) {
            setIsSelecting(true);
            setSelectionRange({ start: focusedCell, end: newPosition });
          } else {
            setSelectionRange((prev) => (prev ? { ...prev, end: newPosition } : null));
          }
        } else {
          setIsSelecting(false);
          setSelectionRange(null);
        }
        setFocusedCell(newPosition);
      }
    },
    [focusedCell, entries.length, getTotalColumns, isValidPosition, isSelecting]
  );

  const toggleCheckbox = useCallback(
    (position: FocusPosition) => {
      const columnId = getColumnId(position.column);

      if (position.row === -1) {
        // Header checkbox
        if (isBulkEditableColumn(position.column)) {
          const currentState = headerCheckboxes[columnId];
          handleHeaderCheckboxChange(columnId, !currentState);
        }
      } else {
        // Row checkbox
        const entryId = getEntryId(position.row);
        if (entryId && isBulkEditableColumn(position.column)) {
          const currentState = rowCheckboxes[entryId]?.[columnId];
          handleCellCheckboxChange(entryId, columnId, !currentState);
        }
      }
    },
    [getColumnId, isBulkEditableColumn, headerCheckboxes, getEntryId, rowCheckboxes]
  );

  const focusColumn = useCallback(
    (columnIndex: number) => {
      if (columnIndex >= 0 && columnIndex < getTotalColumns()) {
        const newPosition: FocusPosition = { row: -1, column: columnIndex };
        setFocusedCell(newPosition);
        setIsSelecting(false);
        setSelectionRange(null);
      }
    },
    [getTotalColumns]
  );

  const selectColumn = useCallback(
    (columnIndex: number) => {
      const columnId = getColumnId(columnIndex);
      if (isBulkEditableColumn(columnIndex)) {
        // Select all cells in the column
        const allEntryIds = entries.map((entry) => entry.sys.id);
        allEntryIds.forEach((entryId) => {
          handleCellCheckboxChange(entryId, columnId, true);
        });
      }
    },
    [getColumnId, isBulkEditableColumn, entries]
  );

  const extendSelectionToEdge = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!focusedCell) return;

      let newPosition = { ...focusedCell };

      switch (direction) {
        case 'up':
          newPosition.row = -1; // Header row
          break;
        case 'down':
          newPosition.row = entries.length - 1; // Last row
          break;
        case 'left':
          newPosition.column = 0; // First column
          break;
        case 'right':
          newPosition.column = getTotalColumns() - 1; // Last column
          break;
      }

      if (isValidPosition(newPosition)) {
        if (!isSelecting) {
          setIsSelecting(true);
          setSelectionRange({ start: focusedCell, end: newPosition });
        } else {
          setSelectionRange((prev) => (prev ? { ...prev, end: newPosition } : null));
        }
        setFocusedCell(newPosition);
      }
    },
    [focusedCell, entries.length, getTotalColumns, isValidPosition, isSelecting]
  );

  // Add click-away listener to unfocus cells when clicking outside the table
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const tableElement = tableRef.current;
      if (tableElement && !tableElement.contains(event.target as Node)) {
        setFocusedCell(null);
        setIsSelecting(false);
        setSelectionRange(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize focus on first render
  useEffect(() => {
    if (!focusedCell && entries.length > 0) {
      // Focus on the first bulk-editable column in the header
      const firstBulkEditableColumn = columnIds.findIndex((columnId) => allowedColumns[columnId]);
      if (firstBulkEditableColumn !== -1) {
        setFocusedCell({ row: -1, column: firstBulkEditableColumn });
      }
    }
  }, [focusedCell, entries.length, columnIds, allowedColumns]);

  // Compute selected field (column)
  const selectedFieldId = useMemo(() => {
    // Only one column can be selected at a time
    const checkedHeaderId = columnIds.find((columnId) => headerCheckboxes[columnId]);
    if (checkedHeaderId && allowedColumns[checkedHeaderId]) return checkedHeaderId;
    for (const entryId in rowCheckboxes) {
      const row = rowCheckboxes[entryId];
      const checkedCellId = columnIds.find((columnId) => allowedColumns[columnId] && row[columnId]);
      if (checkedCellId) return checkedCellId;
    }
    return null;
  }, [headerCheckboxes, rowCheckboxes, allowedColumns, columnIds]);

  // Compute selected entry IDs for the selected field
  const selectedEntryIds = useMemo(() => {
    if (!selectedFieldId) return [];
    // If header is checked, all entries are selected
    if (headerCheckboxes[selectedFieldId]) {
      return entries.map((e) => e.sys.id);
    }
    // Otherwise, collect entry IDs where the cell is checked
    return entries.filter((e) => rowCheckboxes[e.sys.id]?.[selectedFieldId]).map((e) => e.sys.id);
  }, [selectedFieldId, headerCheckboxes, rowCheckboxes, entries]);

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({ selectedEntryIds, selectedFieldId });
    }
  }, [selectedEntryIds, selectedFieldId, onSelectionChange]);

  const handleHeaderCheckboxChange = useCallback(
    (columnId: string, checked: boolean) => {
      setHeaderCheckboxes((previous) => ({ ...previous, [columnId]: checked }));

      setRowCheckboxes((previous) => {
        const updated: Record<string, Record<string, boolean>> = {};
        Object.entries(previous).forEach(([entryId, _]) => {
          updated[entryId] = Object.fromEntries(
            columnIds.map((id) => [id, id === columnId ? checked : false])
          );
        });
        return updated;
      });
    },
    [columnIds]
  );

  const handleCellCheckboxChange = useCallback(
    (entryId: string, columnId: string, checked: boolean) => {
      setRowCheckboxes((previous) => {
        const updated = { ...previous };
        updated[entryId] = {
          ...previous[entryId],
          ...Object.fromEntries(columnIds.map((id) => [id, id === columnId ? checked : false])),
        };
        return updated;
      });

      setHeaderCheckboxes((previous) => ({
        ...Object.fromEntries(columnIds.map((id) => [id, id === columnId ? false : previous[id]])),
      }));
    },
    [columnIds]
  );

  const toggleSelectionCheckboxes = useCallback(() => {
    if (!selectionRange) {
      // No selection, just toggle the focused cell
      if (focusedCell) {
        toggleCheckbox(focusedCell);
      }
      return;
    }

    const { start, end } = selectionRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.column, end.column);
    const maxCol = Math.max(start.column, end.column);

    // Check if all checkboxes in the selection are currently checked
    let allChecked = true;
    let hasAnyCheckbox = false;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isBulkEditableColumn(col)) continue;

        hasAnyCheckbox = true;
        const columnId = getColumnId(col);

        if (row === -1) {
          // Header checkbox
          if (!headerCheckboxes[columnId]) {
            allChecked = false;
            break;
          }
        } else {
          // Row checkbox
          const entryId = getEntryId(row);
          if (entryId && !rowCheckboxes[entryId]?.[columnId]) {
            allChecked = false;
            break;
          }
        }
      }
      if (!allChecked) break;
    }

    // If no checkboxes in selection, don't do anything
    if (!hasAnyCheckbox) return;

    // Toggle all checkboxes in the selection
    const newState = !allChecked;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isBulkEditableColumn(col)) continue;

        const columnId = getColumnId(col);

        if (row === -1) {
          // Header checkbox
          handleHeaderCheckboxChange(columnId, newState);
        } else {
          // Row checkbox
          const entryId = getEntryId(row);
          if (entryId) {
            handleCellCheckboxChange(entryId, columnId, newState);
          }
        }
      }
    }
  }, [
    selectionRange,
    focusedCell,
    toggleCheckbox,
    isBulkEditableColumn,
    getColumnId,
    headerCheckboxes,
    getEntryId,
    rowCheckboxes,
    handleHeaderCheckboxChange,
    handleCellCheckboxChange,
  ]);

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedCell) return;

      const { key, shiftKey, altKey, metaKey } = event;

      // Detect platform for modifier key handling
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isColumnSelectKey = isMac ? metaKey : altKey;
      const isEdgeSelectKey = isMac ? metaKey : altKey;

      // Prevent default behavior for handled keys
      const handledKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Enter',
        'Escape',
        ' ',
      ];
      if (handledKeys.includes(key)) {
        event.preventDefault();
      }

      switch (key) {
        case 'ArrowUp':
          if (isEdgeSelectKey && shiftKey) {
            extendSelectionToEdge('up');
          } else if (shiftKey) {
            moveFocus('up', true);
          } else {
            moveFocus('up');
          }
          break;

        case 'ArrowDown':
          if (isEdgeSelectKey && shiftKey) {
            extendSelectionToEdge('down');
          } else if (shiftKey) {
            moveFocus('down', true);
          } else {
            moveFocus('down');
          }
          break;

        case 'ArrowLeft':
          if (isEdgeSelectKey && shiftKey) {
            extendSelectionToEdge('left');
          } else if (shiftKey) {
            moveFocus('left', true);
          } else {
            moveFocus('left');
          }
          break;

        case 'ArrowRight':
          if (isEdgeSelectKey && shiftKey) {
            extendSelectionToEdge('right');
          } else if (shiftKey) {
            moveFocus('right', true);
          } else {
            moveFocus('right');
          }
          break;

        case 'Tab':
          if (shiftKey) {
            moveFocus('left');
          } else {
            moveFocus('right');
          }
          break;

        case 'Enter':
          if (shiftKey) {
            moveFocus('up');
          } else {
            toggleSelectionCheckboxes();
            moveFocus('down');
          }
          break;

        case 'Escape':
          setFocusedCell(null);
          setIsSelecting(false);
          setSelectionRange(null);
          break;

        case ' ':
          if (isColumnSelectKey) {
            // Alt+Space (Windows/Linux) or Cmd+Space (Mac): Focus all cells in current column
            selectColumn(focusedCell.column);
          } else {
            toggleSelectionCheckboxes();
          }
          break;
      }
    },
    [focusedCell, moveFocus, toggleSelectionCheckboxes, extendSelectionToEdge, selectColumn]
  );

  // Add keyboard event listener
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('keydown', handleKeyDown);
      return () => {
        tableElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown]);

  return (
    <>
      <Table
        ref={tableRef}
        testId="bulk-edit-table"
        style={styles.table}
        tabIndex={0}
        role="grid"
        aria-label="Bulk edit table with keyboard navigation">
        <TableHeader
          fields={fields}
          headerCheckboxes={headerCheckboxes}
          onHeaderCheckboxChange={handleHeaderCheckboxChange}
          checkboxesDisabled={Object.fromEntries(
            columnIds.map((columnId) => [
              columnId,
              allowedColumns[columnId]
                ? selectedFieldId !== null && selectedFieldId !== columnId
                : true,
            ])
          )}
          focusedCell={focusedCell}
          selectionRange={selectionRange}
          onCellFocus={(position) => setFocusedCell(position)}
        />
        <Table.Body>
          {entries.map((entry, rowIndex) => (
            <TableRow
              key={entry.sys.id}
              entry={entry}
              fields={fields}
              contentType={contentType}
              spaceId={spaceId}
              environmentId={environmentId}
              defaultLocale={defaultLocale}
              rowCheckboxes={rowCheckboxes[entry.sys.id]}
              onCellCheckboxChange={(columnId, checked) =>
                handleCellCheckboxChange(entry.sys.id, columnId, checked)
              }
              cellCheckboxesDisabled={Object.fromEntries(
                columnIds.map((columnId) => [
                  columnId,
                  allowedColumns[columnId]
                    ? selectedFieldId !== null && selectedFieldId !== columnId
                    : true,
                ])
              )}
              rowIndex={rowIndex}
              focusedCell={focusedCell}
              selectionRange={selectionRange}
              onCellFocus={(position) => setFocusedCell(position)}
            />
          ))}
        </Table.Body>
      </Table>
      <Box style={styles.paginationContainer}>
        <Pagination
          activePage={activePage}
          onPageChange={onPageChange}
          totalItems={totalEntries}
          showViewPerPage
          viewPerPageOptions={pageSizeOptions}
          itemsPerPage={itemsPerPage}
          onViewPerPageChange={onItemsPerPageChange}
          aria-label="Pagination navigation"
        />
      </Box>
    </>
  );
};
