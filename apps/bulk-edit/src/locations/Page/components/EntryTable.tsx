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
  const totalColumns = fields.length + 2;
  const allowedColumns = [false, false, ...fields.map((f) => isCheckboxAllowed(f))];

  const [headerCheckboxes, setHeaderCheckboxes] = useState<boolean[]>(
    Array(totalColumns).fill(false)
  );
  const [rowCheckboxes, setRowCheckboxes] = useState<Record<string, boolean[]>>(() => {
    const obj: Record<string, boolean[]> = {};
    entries.forEach((e) => {
      obj[e.sys.id] = Array(totalColumns).fill(false);
    });
    return obj;
  });

  const checkedColumn = useMemo(() => {
    // Check if any header checkbox for an allowed column is checked
    const checkedHeaderColumnIndex = headerCheckboxes.findIndex(
      (isChecked, columnIndex) => allowedColumns[columnIndex] && isChecked
    );
    if (checkedHeaderColumnIndex !== -1) return checkedHeaderColumnIndex;

    // If no header checkbox is checked, check all rows for a checked cell in an allowed column
    for (const rowId in rowCheckboxes) {
      const row = rowCheckboxes[rowId];
      const checkedCellColumnIndex = row.findIndex(
        (isChecked, columnIndex) => allowedColumns[columnIndex] && isChecked
      );
      if (checkedCellColumnIndex !== -1) return checkedCellColumnIndex;
    }
    // No checked column found
    return null;
  }, [headerCheckboxes, rowCheckboxes, allowedColumns]);

  const headersVisibility = headerCheckboxes.map((checked) => checked);
  const checkboxesDisabled = allowedColumns.map((allowed, idx) =>
    allowed ? checkedColumn !== null && checkedColumn !== idx : true
  );

  const handleHeaderCheckboxChange = (columnIndex: number, checked: boolean) => {
    setHeaderCheckboxes((prev) => {
      const next = [...prev];
      next[columnIndex] = checked;
      return next;
    });
    setRowCheckboxes((prev) => {
      const next: Record<string, boolean[]> = {};
      Object.entries(prev).forEach(([rowId, arr]) => {
        next[rowId] = arr.map((_, index) => (index === columnIndex ? checked : false));
      });
      return next;
    });
  };

  const handleCellCheckboxChange = (rowId: string, columnIndex: number, checked: boolean) => {
    setRowCheckboxes((prev) => {
      const next = { ...prev };
      next[rowId] = prev[rowId].map((_, index) => (index === columnIndex ? checked : false));
      return next;
    });
    setHeaderCheckboxes((prev) =>
      prev.map((value, index) => (index === columnIndex ? false : value))
    );
  };

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
              cellCheckboxesVisible={headersVisibility}
              cellCheckboxesDisabled={checkboxesDisabled}
              headerCheckboxes={headerCheckboxes}
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
