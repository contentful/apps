import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, Box, Pagination } from '@contentful/f36-components';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { isCheckboxAllowed as isBulkEditable } from '../utils/entryUtils';
import {
  DISPLAY_NAME_COLUMN,
  DISPLAY_NAME_INDEX,
  ENTRY_STATUS_COLUMN,
  HEADERS_ROW,
} from '../utils/constants';
import {
  useKeyboardNavigation,
  FocusPosition,
  SelectionRange,
} from '../hooks/useKeyboardNavigation';

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

  const [headerCheckboxes, setHeaderCheckboxes] = useState<Record<string, boolean>>(
    getInitialCheckboxState(columnIds)
  );
  const [rowCheckboxes, setRowCheckboxes] = useState<Record<string, Record<string, boolean>>>(
    getInitialRowCheckboxState(entries, columnIds)
  );

  // Custom keyboard navigation hook
  const { focusedCell, selectionRange, setFocusedCell, focusCell, tableRef } =
    useKeyboardNavigation({
      totalColumns: columnIds.length,
      entriesLength: entries.length,
      onFocusColumn: (columnIndex: number) => {},
      onToggleSelection: () => {
        // This will be called when selection should be toggled
        toggleSelectionCheckboxes();
      },
    });

  const getEntryId = (rowIndex: number) => {
    return entries[rowIndex]?.sys.id || null;
  };

  // Initialize focus on first render
  useEffect(() => {
    if (!focusedCell && entries.length > 0) {
      setFocusedCell({ row: HEADERS_ROW, column: DISPLAY_NAME_INDEX });
      // Ensure the table element gets focus so keyboard events are captured
      if (tableRef.current) {
        tableRef.current.focus();
      }
    }
  }, [focusedCell, entries, allowedColumns]);

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

  useEffect(() => {
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

  const toggleCheckbox = useCallback(
    (position: FocusPosition) => {
      const columnId = columnIds[position.column];
      if (!allowedColumns[columnId]) return;

      if (position.row === HEADERS_ROW) {
        handleHeaderCheckboxChange(columnId, !headerCheckboxes[columnId]);
      } else {
        const entryId = getEntryId(position.row);
        if (entryId) {
          handleCellCheckboxChange(entryId, columnId, !rowCheckboxes[entryId]?.[columnId]);
        }
      }
    },
    [columnIds, handleHeaderCheckboxChange, handleCellCheckboxChange]
  );

  const toggleSelectionCheckboxes = () => {
    if (!selectionRange) {
      if (focusedCell) {
        toggleCheckbox(focusedCell);
      }
      return;
    }

    const { start, end } = selectionRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const column = start.column; // Single column selection

    const columnId = columnIds[column];
    if (!allowedColumns[columnId]) return;

    // Check if all checkboxes in the selection are currently checked
    let allChecked = true;
    let hasHeaderSelection = false;
    for (let row = minRow; row <= maxRow; row++) {
      if (row === HEADERS_ROW) {
        // Header checkbox
        hasHeaderSelection = true;
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

    // Toggle all checkboxes in the selection
    const newState = !allChecked;

    // First, handle header checkbox if it's in the selection
    if (hasHeaderSelection) {
      handleHeaderCheckboxChange(columnId, newState);
    } else {
      // Handle individual row checkboxes
      for (let row = minRow; row <= maxRow; row++) {
        const entryId = getEntryId(row);
        if (entryId) {
          handleCellCheckboxChange(entryId, columnId, newState);
        }
      }
    }
  };

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
          onCellFocus={(position) => focusCell(position)}
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
              onCellFocus={(position) => focusCell(position)}
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
