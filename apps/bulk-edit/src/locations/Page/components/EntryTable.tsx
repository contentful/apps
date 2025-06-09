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
    const headerIdx = headerCheckboxes.findIndex((checked, idx) => allowedColumns[idx] && checked);
    if (headerIdx !== -1) return headerIdx;

    for (const rowId in rowCheckboxes) {
      const arr = rowCheckboxes[rowId];
      const idx = arr.findIndex((checked, colIdx) => allowedColumns[colIdx] && checked);
      if (idx !== -1) return idx;
    }
    return null;
  }, [headerCheckboxes, rowCheckboxes, allowedColumns]);

  const headersVisibility = headerCheckboxes.map((checked) => checked);
  const checkboxesDisabled = allowedColumns.map((allowed, idx) =>
    allowed ? checkedColumn !== null && checkedColumn !== idx : true
  );

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
