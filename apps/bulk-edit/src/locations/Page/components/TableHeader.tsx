import React, { useEffect, useState } from 'react';
import { Table, Checkbox, Flex, Text, Box } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@phosphor-icons/react';
import { ContentTypeField } from '../types';
import { headerStyles, getCellStyle } from './TableHeader.styles';
import { truncate, isCheckboxAllowed } from '../utils/entryUtils';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN, HEADERS_ROW } from '../utils/constants';
import { FocusPosition, SelectionRange } from '../hooks/useKeyboardNavigation';

interface TableHeaderProps {
  fields: ContentTypeField[];
  headerCheckboxes: Record<string, boolean>;
  onHeaderCheckboxChange: (columnId: string, checked: boolean) => void;
  checkboxesDisabled: Record<string, boolean>;
  focusedCell: FocusPosition | null;
  selectionRange: SelectionRange | null;
  onCellFocus: (position: FocusPosition) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  headerCheckboxes,
  onHeaderCheckboxChange,
  checkboxesDisabled,
  focusedCell,
  selectionRange,
  onCellFocus,
}) => {
  const isCellFocused = (columnIndex: number) => {
    return focusedCell?.row === HEADERS_ROW && focusedCell?.column === columnIndex;
  };

  const isCellSelected = (columnIndex: number) => {
    if (!selectionRange) return false;
    const { start, end } = selectionRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const column = start.column; // Single column selection

    return -1 >= minRow && -1 <= maxRow && columnIndex === column;
  };

  const getColumnIndex = (field: ContentTypeField | string) => {
    const fieldId = typeof field === 'string' ? field : field.uniqueId;
    const allColumns = [DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN, ...fields.map((f) => f.uniqueId)];
    return allColumns.indexOf(fieldId);
  };

  return (
    <Table.Head style={headerStyles.tableHead}>
      <Table.Row style={headerStyles.stickyTableRow}>
        <Table.Cell
          as="th"
          key={DISPLAY_NAME_COLUMN}
          style={getCellStyle(
            headerStyles.displayNameHeader,
            isCellFocused(getColumnIndex(DISPLAY_NAME_COLUMN)),
            isCellSelected(getColumnIndex(DISPLAY_NAME_COLUMN))
          )}
          onClick={() =>
            onCellFocus({ row: HEADERS_ROW, column: getColumnIndex(DISPLAY_NAME_COLUMN) })
          }
          role="columnheader"
          tabIndex={-1}
          aria-label="Column header: Display name">
          Display name
        </Table.Cell>
        <Table.Cell
          as="th"
          key={ENTRY_STATUS_COLUMN}
          style={getCellStyle(
            headerStyles.statusHeader,
            isCellFocused(getColumnIndex(ENTRY_STATUS_COLUMN)),
            isCellSelected(getColumnIndex(ENTRY_STATUS_COLUMN))
          )}
          onClick={() =>
            onCellFocus({ row: HEADERS_ROW, column: getColumnIndex(ENTRY_STATUS_COLUMN) })
          }
          role="columnheader"
          tabIndex={-1}
          aria-label="Column header: Status">
          <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
            Status
            <Tooltip content="Bulk editing is not supported for Status" placement="top">
              <QuestionIcon size={16} aria-label="Bulk editing not supported for Status" />
            </Tooltip>
          </Flex>
        </Table.Cell>
        {fields.map((field) => {
          const isAllowed = isCheckboxAllowed(field);
          const isDisabled = checkboxesDisabled[field.uniqueId];
          const columnIndex = getColumnIndex(field);
          const fieldName = truncate(field.locale ? `(${field.locale}) ${field.name}` : field.name);

          return (
            <Table.Cell
              as="th"
              key={field.uniqueId}
              style={getCellStyle(
                headerStyles.tableHeader,
                isCellFocused(columnIndex),
                isCellSelected(columnIndex)
              )}
              isTruncated
              onClick={() => onCellFocus({ row: HEADERS_ROW, column: columnIndex })}
              role="columnheader"
              tabIndex={-1}>
              <Flex gap="spacingXs">
                {isAllowed ? (
                  <>
                    <Checkbox
                      isChecked={headerCheckboxes[field.uniqueId]}
                      isDisabled={isDisabled}
                      onChange={(e) => onHeaderCheckboxChange(field.uniqueId, e.target.checked)}
                      testId={`header-checkbox-${field.uniqueId}`}
                      aria-label={`Select all for ${fieldName}`}
                      tabIndex={-1}
                    />
                    <Text
                      fontSize="fontSizeS"
                      fontWeight="fontWeightMedium"
                      lineHeight="lineHeightS"
                      fontColor="gray900">
                      {fieldName}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      fontSize="fontSizeS"
                      fontWeight="fontWeightMedium"
                      lineHeight="lineHeightS"
                      fontColor="gray500">
                      {fieldName}
                    </Text>
                    <Tooltip
                      content={`Bulk editing is not supported for the ${field.name} field type`}
                      placement="top">
                      <QuestionIcon
                        size={16}
                        aria-label={`Bulk editing not supported for ${field.name}`}
                      />
                    </Tooltip>
                  </>
                )}
              </Flex>
            </Table.Cell>
          );
        })}
      </Table.Row>
    </Table.Head>
  );
};
