import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Pagination, Table } from '@contentful/f36-components';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ContentTypeField, Entry } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { getEntryUrl, isCheckboxAllowed as isBulkEditable } from '../utils/entryUtils';
import {
  DISPLAY_NAME_COLUMN,
  DISPLAY_NAME_INDEX,
  ENTRY_STATUS_COLUMN,
  ESTIMATED_ROW_HEIGHT,
  HEADERS_ROW,
} from '../utils/constants';
import { FocusPosition, useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { tableStyles } from './EntryTable.styles';

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

  // Virtual scrolling setup
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT, // Estimated row height in pixels
    overscan: 10, // Extra rows rendered for smooth scrolling
  });

  const getEntryId = (rowIndex: number) => {
    return entries[rowIndex]?.sys.id || null;
  };

  const selectedFieldId = useMemo(() => {
    const checkedHeaderId = columnIds.find((columnId) => headerCheckboxes[columnId]);
    if (checkedHeaderId && allowedColumns[checkedHeaderId]) return checkedHeaderId;
    for (const entryId in rowCheckboxes) {
      const row = rowCheckboxes[entryId];
      const checkedCellId = columnIds.find((columnId) => allowedColumns[columnId] && row[columnId]);
      if (checkedCellId) return checkedCellId;
    }
    return null;
  }, [headerCheckboxes, rowCheckboxes, allowedColumns, columnIds]);

  const selectedEntryIds = useMemo(() => {
    if (!selectedFieldId) return [];

    if (headerCheckboxes[selectedFieldId]) {
      return entries.map((e) => e.sys.id);
    }
    return entries.filter((e) => rowCheckboxes[e.sys.id]?.[selectedFieldId]).map((e) => e.sys.id);
  }, [selectedFieldId, headerCheckboxes, rowCheckboxes, entries]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({ selectedEntryIds, selectedFieldId });
    }
  }, [selectedEntryIds, selectedFieldId, onSelectionChange]);

  const handleHeaderCheckboxChange = useCallback(
    (columnId: string, checked: boolean) => {
      // Clear all header checkboxes and set only the target one
      // This is to avoid the issue where multiple header checkboxes are checked simultaneously
      setHeaderCheckboxes((previous) =>
        Object.fromEntries(columnIds.map((id) => [id, id === columnId ? checked : false]))
      );

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
        const updated: Record<string, Record<string, boolean>> = {};
        Object.entries(previous).forEach(([currentEntryId, currentRow]) => {
          updated[currentEntryId] = Object.fromEntries(
            columnIds.map((id) => {
              if (id === columnId) {
                // For the target column, set the checkbox state for the target entry
                return [id, currentEntryId === entryId ? checked : currentRow[id]];
              } else {
                // Clear all other checkboxes
                return [id, false];
              }
            })
          );
        });
        return updated;
      });

      // Clear all header checkboxes when a cell is selected
      setHeaderCheckboxes(Object.fromEntries(columnIds.map((id) => [id, false])));
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

  const toggleCheckboxes = () => {
    if (!focusRange) {
      if (focusedCell) {
        toggleCheckbox(focusedCell);
      }
      return;
    }

    const { start, end } = focusRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const columnId = columnIds[start.column];

    if (!allowedColumns[columnId]) return;

    const hasHeaderFocused = minRow <= HEADERS_ROW && maxRow >= HEADERS_ROW;

    let allChecked = true;

    if (hasHeaderFocused) {
      allChecked = headerCheckboxes[columnId];
    } else {
      for (let row = minRow; row <= maxRow; row++) {
        const entryId = getEntryId(row);
        if (entryId && !rowCheckboxes[entryId]?.[columnId]) {
          allChecked = false;
          break;
        }
      }
    }

    const newState = !allChecked;

    // Apply the new state
    if (hasHeaderFocused) {
      handleHeaderCheckboxChange(columnId, newState);
    } else {
      for (let row = minRow; row <= maxRow; row++) {
        const entryId = getEntryId(row);
        if (entryId) {
          handleCellCheckboxChange(entryId, columnId, newState);
        }
      }
    }
  };

  const handleCellAction = (position: FocusPosition) => {
    const { row: rowIndex, column: columnIndex } = position;
    const columnId = columnIds[columnIndex];
    const isHeaderRow = rowIndex === HEADERS_ROW;

    if (columnIndex === DISPLAY_NAME_INDEX && !isHeaderRow) {
      const entry = entries[rowIndex];
      if (entry) {
        const url = getEntryUrl(entry, spaceId, environmentId);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else if (allowedColumns[columnId]) {
      toggleCheckboxes();
    }
  };

  const { focusedCell, focusRange, focusCell, tableRef } = useKeyboardNavigation({
    totalColumns: columnIds.length,
    entriesLength: entries.length,
    onCellAction: handleCellAction,
  });

  return (
    <>
      <Box ref={scrollContainerRef} style={tableStyles.tableContainer}>
        <Table
          ref={tableRef}
          testId="bulk-edit-table"
          style={tableStyles.table}
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
            focusRange={focusRange}
            onCellFocus={(position) => focusCell(position)}
          />
          <Table.Body>
            {/* Top spacer row */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td colSpan={columnIds.length} style={tableStyles.topSpacer(rowVirtualizer)} />
              </tr>
            )}

            {/* Virtualized rows */}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const entry = entries[virtualRow.index];
              if (!entry) return null;

              return (
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
                  rowIndex={virtualRow.index}
                  focusedCell={focusedCell}
                  focusRange={focusRange}
                  onCellFocus={(position) => focusCell(position)}
                />
              );
            })}

            {/* Bottom spacer row */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td colSpan={columnIds.length} style={tableStyles.bottomSpacer(rowVirtualizer)} />
              </tr>
            )}
          </Table.Body>
        </Table>
      </Box>
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
