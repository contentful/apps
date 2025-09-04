import React, { useState } from 'react';
import { Table, TextLink, Badge, Checkbox, Flex, Text } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles, getCellStyle } from '../styles';
import {
  getStatusFromEntry,
  renderFieldValue,
  getEntryTitle,
  getEntryUrl,
  isCheckboxAllowed,
  truncate,
  getStatusColor,
} from '../utils/entryUtils';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from '../utils/constants';
import { FocusPosition, SelectionRange } from '../hooks/useKeyboardNavigation';

interface TableRowProps {
  entry: Entry;
  fields: ContentTypeField[];
  contentType: ContentTypeProps;
  spaceId: string;
  environmentId: string;
  defaultLocale: string;
  rowCheckboxes: Record<string, boolean>;
  onCellCheckboxChange: (columnId: string, checked: boolean) => void;
  cellCheckboxesDisabled: Record<string, boolean>;
  rowIndex: number;
  focusedCell: FocusPosition | null;
  selectionRange: SelectionRange | null;
  onCellFocus: (position: FocusPosition) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  entry,
  fields,
  contentType,
  spaceId,
  environmentId,
  defaultLocale,
  rowCheckboxes,
  onCellCheckboxChange,
  cellCheckboxesDisabled,
  rowIndex,
  focusedCell,
  selectionRange,
  onCellFocus,
}) => {
  const status = getStatusFromEntry(entry);
  const statusColor = getStatusColor(status);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const displayField = contentType.displayField;
  const displayValue = displayField ? entry.fields[displayField]?.[defaultLocale] : entry.sys.id;

  const isCellFocused = (columnIndex: number) => {
    return focusedCell?.row === rowIndex && focusedCell?.column === columnIndex;
  };

  const isCellSelected = (columnIndex: number) => {
    if (!selectionRange) return false;
    const { start, end } = selectionRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.column, end.column);
    const maxCol = Math.max(start.column, end.column);

    return (
      rowIndex >= minRow && rowIndex <= maxRow && columnIndex >= minCol && columnIndex <= maxCol
    );
  };

  const getColumnIndex = (field: ContentTypeField | string) => {
    const fieldId = typeof field === 'string' ? field : field.uniqueId;
    const allColumns = [DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN, ...fields.map((f) => f.uniqueId)];
    return allColumns.indexOf(fieldId);
  };

  // Helper function to get cell style
  const getCellStyleForColumn = (baseStyle: React.CSSProperties, columnId: string) => {
    const columnIndex = getColumnIndex(columnId);
    return getCellStyle(baseStyle, isCellFocused(columnIndex), isCellSelected(columnIndex));
  };

  return (
    <Table.Row key={entry.sys.id}>
      <Table.Cell
        testId="display-name-cell"
        style={getCellStyleForColumn(styles.displayNameCell, DISPLAY_NAME_COLUMN)}
        onClick={() => onCellFocus({ row: rowIndex, column: getColumnIndex(DISPLAY_NAME_COLUMN) })}
        role="gridcell"
        tabIndex={-1}>
        <TextLink
          href={getEntryUrl(entry, spaceId, environmentId)}
          target="_blank"
          rel="noopener noreferrer"
          testId="entry-link"
          icon={<ExternalLinkIcon />}
          alignIcon="end">
          {getEntryTitle(entry, contentType, defaultLocale)}
        </TextLink>
      </Table.Cell>
      <Table.Cell
        testId="status-cell"
        style={getCellStyleForColumn(styles.statusCell, ENTRY_STATUS_COLUMN)}
        onClick={() => onCellFocus({ row: rowIndex, column: getColumnIndex(ENTRY_STATUS_COLUMN) })}
        role="gridcell"
        tabIndex={-1}>
        <Badge variant={statusColor}>{status}</Badge>
      </Table.Cell>
      {fields.map((field) => {
        const isAllowed = isCheckboxAllowed(field);
        const isDisabled = cellCheckboxesDisabled[field.uniqueId];
        const isVisible =
          (hoveredColumn === field.uniqueId && !isDisabled) || rowCheckboxes[field.uniqueId];
        const columnIndex = getColumnIndex(field);
        const fieldValue = entry.fields[field.id]?.[field.locale || defaultLocale];

        return (
          <Table.Cell
            key={field.uniqueId}
            style={getCellStyle(
              styles.cell,
              isCellFocused(columnIndex),
              isCellSelected(columnIndex)
            )}
            onMouseEnter={() => setHoveredColumn(field.uniqueId)}
            onMouseLeave={() => setHoveredColumn(null)}
            onClick={() => onCellFocus({ row: rowIndex, column: columnIndex })}
            role="gridcell"
            tabIndex={-1}
            isTruncated>
            {isAllowed ? (
              <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                {isVisible && (
                  <Checkbox
                    isChecked={rowCheckboxes[field.uniqueId]}
                    isDisabled={isDisabled}
                    onChange={(e) => onCellCheckboxChange(field.uniqueId, e.target.checked)}
                    testId={`cell-checkbox-${field.uniqueId}`}
                    aria-label={`Select ${truncate(field.name)} for ${displayValue}`}
                  />
                )}
                {renderFieldValue(field, fieldValue)}
              </Flex>
            ) : (
              <Text fontColor="gray500">{renderFieldValue(field, fieldValue)}</Text>
            )}
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
};
