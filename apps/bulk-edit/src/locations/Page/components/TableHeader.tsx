import React from 'react';
import { Table, Checkbox, Flex, Text, Box } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@phosphor-icons/react';
import { ContentTypeField } from '../types';
import { styles } from '../styles';
import { truncate, isCheckboxAllowed } from '../utils/entryUtils';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from '../utils/constants';

interface FocusPosition {
  row: number;
  column: number;
}

interface SelectionRange {
  start: FocusPosition;
  end: FocusPosition;
}

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
    return focusedCell?.row === -1 && focusedCell?.column === columnIndex;
  };

  const isCellSelected = (columnIndex: number) => {
    if (!selectionRange) return false;
    const { start, end } = selectionRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.column, end.column);
    const maxCol = Math.max(start.column, end.column);

    return -1 >= minRow && -1 <= maxRow && columnIndex >= minCol && columnIndex <= maxCol;
  };

  const getColumnIndex = (field: ContentTypeField | string) => {
    const fieldId = typeof field === 'string' ? field : field.uniqueId;
    const allColumns = [DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN, ...fields.map((f) => f.uniqueId)];
    return allColumns.indexOf(fieldId);
  };
  return (
    <Table.Head style={styles.tableHead}>
      <Table.Row style={styles.stickyTableRow}>
        <Table.Cell
          as="th"
          key={DISPLAY_NAME_COLUMN}
          style={{
            ...styles.displayNameHeader,
            ...(isCellFocused(getColumnIndex(DISPLAY_NAME_COLUMN)) && styles.focusedCell),
            ...(isCellSelected(getColumnIndex(DISPLAY_NAME_COLUMN)) && styles.selectedCell),
          }}
          onClick={() => onCellFocus({ row: -1, column: getColumnIndex(DISPLAY_NAME_COLUMN) })}
          role="columnheader"
          tabIndex={-1}>
          Display name
        </Table.Cell>
        <Table.Cell
          as="th"
          key={ENTRY_STATUS_COLUMN}
          style={{
            ...styles.statusHeader,
            ...(isCellFocused(getColumnIndex(ENTRY_STATUS_COLUMN)) && styles.focusedCell),
            ...(isCellSelected(getColumnIndex(ENTRY_STATUS_COLUMN)) && styles.selectedCell),
          }}
          onClick={() => onCellFocus({ row: -1, column: getColumnIndex(ENTRY_STATUS_COLUMN) })}
          role="columnheader"
          tabIndex={-1}>
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

          if (isAllowed) {
            return (
              <Table.Cell
                as="th"
                key={field.uniqueId}
                style={{
                  ...styles.tableHeader,
                  ...(isCellFocused(columnIndex) && styles.focusedCell),
                  ...(isCellSelected(columnIndex) && styles.selectedCell),
                }}
                isTruncated
                onClick={() => onCellFocus({ row: -1, column: columnIndex })}
                role="columnheader"
                tabIndex={-1}>
                <Flex gap="spacingXs">
                  <Checkbox
                    isChecked={headerCheckboxes[field.uniqueId]}
                    isDisabled={isDisabled}
                    onChange={(e) => onHeaderCheckboxChange(field.uniqueId, e.target.checked)}
                    testId={`header-checkbox-${field.uniqueId}`}
                    aria-label={`Select all for ${truncate(field.name)}`}
                  />
                  <Text
                    fontSize="fontSizeS"
                    fontWeight="fontWeightMedium"
                    lineHeight="lineHeightS"
                    fontColor="gray900">
                    {truncate(field.locale ? `(${field.locale}) ${field.name}` : field.name)}
                  </Text>
                </Flex>
              </Table.Cell>
            );
          }
          return (
            <Table.Cell
              as="th"
              key={field.uniqueId}
              style={{
                ...styles.tableHeader,
                ...(isCellFocused(columnIndex) && styles.focusedCell),
                ...(isCellSelected(columnIndex) && styles.selectedCell),
              }}
              onClick={() => onCellFocus({ row: -1, column: columnIndex })}
              role="columnheader"
              tabIndex={-1}>
              <Flex gap="spacingXs">
                <Text
                  fontSize="fontSizeS"
                  fontWeight="fontWeightMedium"
                  lineHeight="lineHeightS"
                  fontColor="gray500">
                  {truncate(field.locale ? `(${field.locale}) ${field.name}` : field.name)}
                </Text>
                <Tooltip
                  content={`Bulk editing is not supported for the ${field.name} field type`}
                  placement="top">
                  <QuestionIcon
                    size={16}
                    aria-label={`Bulk editing not supported for ${field.name}`}
                  />
                </Tooltip>
              </Flex>
            </Table.Cell>
          );
        })}
      </Table.Row>
    </Table.Head>
  );
};
