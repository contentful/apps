import React, { useState, useMemo } from 'react';
import { Table, Box, Pagination } from '@contentful/f36-components';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { isCheckboxAllowed } from '../utils/entryUtils';

interface EntryTableProps {
  entries: Entry[];
  fields: ContentTypeField[];
  contentType?: ContentTypeProps;
  spaceId: string;
  environmentId: string;
  locale: string;
  activePage: number;
  totalEntries: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions: number[];
}

export const EntryTable: React.FC<EntryTableProps> = ({
  entries,
  fields,
  contentType,
  spaceId,
  environmentId,
  locale,
  activePage,
  totalEntries,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions,
}) => {
  // Calculate total columns: 0 = display name, 1 = status, 2+ = fields
  const totalColumns = fields.length + 2;
  // Which columns are allowed for checkboxes
  const allowedColumns = useMemo(
    () => [false, false, ...fields.map((f) => isCheckboxAllowed(f))],
    [fields]
  );

  // State: header checkboxes, row checkboxes (per row, per column)
  const [headerCheckboxes, setHeaderCheckboxes] = useState<boolean[]>(
    Array(totalColumns).fill(false)
  );
  // rowCheckboxes: { [entryId]: boolean[] }
  const [rowCheckboxes, setRowCheckboxes] = useState<Record<string, boolean[]>>(() => {
    const obj: Record<string, boolean[]> = {};
    entries.forEach((e) => {
      obj[e.sys.id] = Array(totalColumns).fill(false);
    });
    return obj;
  });

  // If any header or cell is checked, only that column is enabled, others are disabled
  const activeCol = useMemo(() => {
    // Check header
    const headerIdx = headerCheckboxes.findIndex((checked, idx) => allowedColumns[idx] && checked);
    if (headerIdx !== -1) return headerIdx;
    // Check cells
    for (const rowId in rowCheckboxes) {
      const arr = rowCheckboxes[rowId];
      const idx = arr.findIndex((checked, colIdx) => allowedColumns[colIdx] && checked);
      if (idx !== -1) return idx;
    }
    return null;
  }, [headerCheckboxes, rowCheckboxes, allowedColumns]);

  // Handlers
  const handleHeaderCheckboxChange = (colIndex: number, checked: boolean) => {
    setHeaderCheckboxes((prev) => {
      const next = [...prev];
      next[colIndex] = checked;
      return next;
    });
    setRowCheckboxes((prev) => {
      const next: Record<string, boolean[]> = {};
      Object.entries(prev).forEach(([rowId, arr]) => {
        next[rowId] = arr.map((v, idx) => (idx === colIndex ? checked : false));
      });
      return next;
    });
  };

  const handleCellCheckboxChange = (rowId: string, colIndex: number, checked: boolean) => {
    setRowCheckboxes((prev) => {
      const next = { ...prev };
      next[rowId] = prev[rowId].map((v, idx) => (idx === colIndex ? checked : false));
      return next;
    });
    setHeaderCheckboxes((prev) => prev.map((v, idx) => (idx === colIndex ? false : v)));
  };

  // Visibility: header checkboxes always visible; cell checkboxes visible if header checked, or cell checked, or hovered (hover handled in TableRow)
  const cellCheckboxesVisible = useMemo(
    () => headerCheckboxes.map((checked, idx) => checked),
    [headerCheckboxes]
  );

  // Disabled: if any col is active, only that col is enabled
  const checkboxesDisabled = useMemo(
    () =>
      allowedColumns.map((allowed, idx) =>
        allowed ? activeCol !== null && activeCol !== idx : true
      ),
    [allowedColumns, activeCol]
  );

  // For each row, build rowCheckboxes, cellCheckboxesVisible, cellCheckboxesDisabled
  return (
    <>
      <Table testId="bulk-edit-table" style={styles.table}>
        <TableHeader
          fields={fields}
          headerCheckboxes={headerCheckboxes}
          onHeaderCheckboxChange={handleHeaderCheckboxChange}
          checkboxesDisabled={checkboxesDisabled}
        />
        <Table.Body>
          {entries.map((entry) => (
            <TableRow
              key={entry.sys.id}
              entry={entry}
              fields={fields}
              contentType={contentType}
              spaceId={spaceId}
              environmentId={environmentId}
              locale={locale}
              rowCheckboxes={rowCheckboxes[entry.sys.id] || Array(totalColumns).fill(false)}
              onCellCheckboxChange={handleCellCheckboxChange}
              cellCheckboxesVisible={cellCheckboxesVisible}
              cellCheckboxesDisabled={checkboxesDisabled}
              headerCheckboxes={headerCheckboxes}
              displayFieldId={contentType?.displayField}
            />
          ))}
        </Table.Body>
      </Table>
      <Box marginTop="spacingM">
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
