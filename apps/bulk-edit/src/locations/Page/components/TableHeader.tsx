import React from 'react';
import { Table, Checkbox, Flex, Text } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@contentful/f36-icons';
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

interface FocusedTooltipProps {
  content: string;
  isFocused: boolean;
  children: React.ReactNode;
}

const FocusedTooltip: React.FC<FocusedTooltipProps> = ({ content, isFocused, children }) => {
  return (
    <Tooltip
      content={content}
      placement="top"
      showDelay={0}
      hideDelay={0}
      key={`tooltip-${isFocused ? 'focused' : 'not-focused'}`}
      isVisible={isFocused}>
      {children}
    </Tooltip>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  headerCheckboxes,
  onHeaderCheckboxChange,
  checkboxesDisabled,
  focusedCell,
  focusRange,
  onCellFocus,
}) => {
  const isStatusFocused =
    focusedCell?.row === HEADERS_ROW && focusedCell?.column === ENTRY_STATUS_INDEX;

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
          aria-label="Column header: Display name"
          data-row={HEADERS_ROW}
          data-column={DISPLAY_NAME_INDEX}>
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
          aria-label="Column header: Status"
          data-row={HEADERS_ROW}
          data-column={ENTRY_STATUS_INDEX}>
          <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
            Status
            <FocusedTooltip
              content="Bulk editing is not supported for Status"
              isFocused={isStatusFocused}>
              <QuestionIcon aria-label="Bulk editing not supported for Status" size="small" />
            </FocusedTooltip>
          </Flex>
        </Table.Cell>
        {fields.map((field) => {
          const isAllowed = isCheckboxAllowed(field);
          const isDisabled = checkboxesDisabled[field.uniqueId];
          const columnIndex = getColumnIndex(field, fields);
          const fieldName = truncate(field.locale ? `(${field.locale}) ${field.name}` : field.name);
          const isFieldFocused =
            focusedCell?.row === HEADERS_ROW && focusedCell?.column === columnIndex;

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
              tabIndex={-1}
              data-row={HEADERS_ROW}
              data-column={columnIndex}>
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
                    <FocusedTooltip
                      content={`Bulk editing is not supported for the ${field.name} field type`}
                      isFocused={isFieldFocused}>
                      <QuestionIcon
                        aria-label={`Bulk editing not supported for ${field.name}`}
                        size="small"
                      />
                    </FocusedTooltip>
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
