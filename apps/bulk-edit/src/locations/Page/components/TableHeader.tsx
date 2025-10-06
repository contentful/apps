import React, { useEffect, useState } from 'react';
import { Table, Checkbox, Flex, Text, Box } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@phosphor-icons/react';
import { ContentTypeField } from '../types';
import { headerStyles } from './TableHeader.styles';
import { truncate, isCheckboxAllowed } from '../utils/entryUtils';
import {
  DISPLAY_NAME_COLUMN,
  DISPLAY_NAME_INDEX,
  ENTRY_STATUS_COLUMN,
  ENTRY_STATUS_INDEX,
  HEADERS_ROW,
} from '../utils/constants';
import { FocusPosition, FocusRange } from '../hooks/useKeyboardNavigation';
import {
  getColumnIndex,
  isCellFocused,
  isCellInFocusRange,
  getCellStyle,
} from '../utils/tableUtils';

interface TableHeaderProps {
  fields: ContentTypeField[];
  headerCheckboxes: Record<string, boolean>;
  onHeaderCheckboxChange: (columnId: string, checked: boolean) => void;
  checkboxesDisabled: Record<string, boolean>;
  focusedCell: FocusPosition | null;
  focusRange: FocusRange | null;
  onCellFocus: (position: FocusPosition) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  headerCheckboxes,
  onHeaderCheckboxChange,
  checkboxesDisabled,
  focusedCell,
  focusRange,
  onCellFocus,
}) => {
  // Using Tooltip props: isDisabled to prevent showing unless the header is focused
  return (
    <Table.Head style={headerStyles.tableHead}>
      <Table.Row style={headerStyles.stickyTableRow}>
        <Table.Cell
          as="th"
          key={DISPLAY_NAME_COLUMN}
          style={getCellStyle(
            headerStyles.displayNameHeader,
            isCellFocused({ row: HEADERS_ROW, column: DISPLAY_NAME_INDEX }, focusedCell) ||
              isCellInFocusRange({ row: HEADERS_ROW, column: DISPLAY_NAME_INDEX }, focusRange)
          )}
          onClick={() => onCellFocus({ row: HEADERS_ROW, column: DISPLAY_NAME_INDEX })}
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
            isCellFocused({ row: HEADERS_ROW, column: ENTRY_STATUS_INDEX }, focusedCell) ||
              isCellInFocusRange({ row: HEADERS_ROW, column: ENTRY_STATUS_INDEX }, focusRange)
          )}
          onClick={() => onCellFocus({ row: HEADERS_ROW, column: ENTRY_STATUS_INDEX })}
          role="columnheader"
          tabIndex={-1}
          aria-label="Column header: Status">
          <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
            Status
            <Tooltip
              content="Bulk editing is not supported for Status"
              placement="top"
              showDelay={0}
              hideDelay={0}
              isVisible={true}
              isDisabled={
                !(
                  focusedCell &&
                  focusedCell.row === HEADERS_ROW &&
                  focusedCell.column === ENTRY_STATUS_INDEX
                )
              }>
              <QuestionIcon size={16} aria-label="Bulk editing not supported for Status" />
            </Tooltip>
          </Flex>
        </Table.Cell>
        {fields.map((field) => {
          const isAllowed = isCheckboxAllowed(field);
          const isDisabled = checkboxesDisabled[field.uniqueId];
          const columnIndex = getColumnIndex(field, fields);
          const fieldName = truncate(field.locale ? `(${field.locale}) ${field.name}` : field.name);

          return (
            <Table.Cell
              as="th"
              key={field.uniqueId}
              style={getCellStyle(
                headerStyles.tableHeader,
                isCellFocused({ row: HEADERS_ROW, column: columnIndex }, focusedCell) ||
                  isCellInFocusRange({ row: HEADERS_ROW, column: columnIndex }, focusRange)
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
                      placement="top"
                      showDelay={0}
                      hideDelay={0}
                      isVisible={true}
                      isDisabled={
                        !(
                          focusedCell &&
                          focusedCell.row === HEADERS_ROW &&
                          focusedCell.column === columnIndex
                        )
                      }>
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
