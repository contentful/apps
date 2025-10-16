import React, { useEffect, useState } from 'react';
import { Table, TextLink, Badge, Checkbox, Flex, Text } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { rowStyles } from './TableRow.styles';
import {
  getStatusFromEntry,
  renderFieldValue,
  getEntryTitle,
  getEntryUrl,
  isCheckboxAllowed,
  truncate,
  getStatusColor,
} from '../utils/entryUtils';
import {
  DISPLAY_NAME_COLUMN,
  DISPLAY_NAME_INDEX,
  ENTRY_STATUS_COLUMN,
  ENTRY_STATUS_INDEX,
} from '../utils/constants';
import { FocusPosition, FocusRange } from '../hooks/useKeyboardNavigation';
import {
  getColumnIndex,
  isCellFocused,
  isCellInFocusRange,
  getCellStyle,
} from '../utils/tableUtils';

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
  focusRange: FocusRange | null;
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
  focusRange,
  onCellFocus,
}) => {
  const status = getStatusFromEntry(entry);
  const statusColor = getStatusColor(status);
  const displayField = contentType.displayField;
  const displayValue = displayField ? entry.fields[displayField]?.[defaultLocale] : entry.sys.id;

  const getCellStyleForColumn = (baseStyle: React.CSSProperties, columnId: string) => {
    const columnIndex = getColumnIndex(columnId, fields);
    return getCellStyle(
      baseStyle,
      isCellFocused({ row: rowIndex, column: columnIndex }, focusedCell) ||
        isCellInFocusRange({ row: rowIndex, column: columnIndex }, focusRange)
    );
  };

  return (
    <Table.Row key={entry.sys.id}>
      <Table.Cell
        testId="display-name-cell"
        style={getCellStyleForColumn(rowStyles.displayNameCell, DISPLAY_NAME_COLUMN)}
        aria-label={`Display name for ${displayValue}`}
        onClick={() => onCellFocus({ row: rowIndex, column: DISPLAY_NAME_INDEX })}
        role="gridcell"
        tabIndex={-1}
        data-row={rowIndex}
        data-column={DISPLAY_NAME_INDEX}>
        <TextLink
          href={getEntryUrl(entry, spaceId, environmentId)}
          target="_blank"
          rel="noopener noreferrer"
          testId="entry-link"
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          tabIndex={-1}>
          {getEntryTitle(entry, contentType, defaultLocale)}
        </TextLink>
      </Table.Cell>
      <Table.Cell
        testId="status-cell"
        aria-label={`Status for ${displayValue}`}
        style={getCellStyleForColumn(rowStyles.statusCell, ENTRY_STATUS_COLUMN)}
        onClick={() => onCellFocus({ row: rowIndex, column: ENTRY_STATUS_INDEX })}
        role="gridcell"
        tabIndex={-1}
        data-row={rowIndex}
        data-column={ENTRY_STATUS_INDEX}>
        <Badge variant={statusColor}>{status}</Badge>
      </Table.Cell>
      {fields.map((field) => {
        const isAllowed = isCheckboxAllowed(field);
        const isDisabled = cellCheckboxesDisabled[field.uniqueId];
        const columnIndex = getColumnIndex(field, fields);
        const fieldValue = entry.fields[field.id]?.[field.locale || defaultLocale];

        return (
          <Table.Cell
            key={field.uniqueId}
            style={getCellStyle(
              rowStyles.cell,
              isCellFocused({ row: rowIndex, column: columnIndex }, focusedCell) ||
                isCellInFocusRange({ row: rowIndex, column: columnIndex }, focusRange)
            )}
            onClick={() => onCellFocus({ row: rowIndex, column: columnIndex })}
            role="gridcell"
            tabIndex={-1}
            isTruncated
            data-row={rowIndex}
            data-column={columnIndex}>
            {isAllowed ? (
              <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                <Checkbox
                  isChecked={rowCheckboxes[field.uniqueId]}
                  isDisabled={isDisabled}
                  onChange={(e) => onCellCheckboxChange(field.uniqueId, e.target.checked)}
                  testId={`cell-checkbox-${field.uniqueId}`}
                  aria-label={`Select ${truncate(field.name)} for ${displayValue}`}
                  tabIndex={-1}
                />
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
