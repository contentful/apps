import React from 'react';
import { Table, Checkbox, Flex, Text, Box } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@phosphor-icons/react';
import { ContentTypeField } from '../types';
import { styles } from '../styles';
import { truncate, isCheckboxAllowed } from '../utils/entryUtils';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from '../utils/constants';
import { useTableCellFocus } from '../hooks/useTableCellFocus';

interface TableHeaderProps {
  fields: ContentTypeField[];
  headerCheckboxes: Record<string, boolean>;
  onHeaderCheckboxChange: (columnId: string, checked: boolean) => void;
  checkboxesDisabled: Record<string, boolean>;
  onCellFocus?: (rowIndex: number, columnIndex: number) => void;
  onRegisterFocusableElement?: (key: string, element: HTMLElement | null) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  headerCheckboxes,
  onHeaderCheckboxChange,
  checkboxesDisabled,
  onCellFocus,
  onRegisterFocusableElement,
}) => {
  const {
    displayNameRef,
    statusRef,
    fieldRefs,
    checkboxRefs,
    handleCellFocus,
    handleCellBlur,
    getTextStyle,
    getCheckboxStyle,
  } = useTableCellFocus({
    fields,
    rowIndex: 0, // Header is always row 0
    onCellFocus,
    onRegisterFocusableElement,
  });

  return (
    <Table.Head style={styles.tableHead}>
      <Table.Row style={styles.stickyTableRow}>
        <Table.Cell as="th" key={DISPLAY_NAME_COLUMN} style={styles.displayNameHeader}>
          <Text
            ref={displayNameRef}
            style={getTextStyle(0)}
            onFocus={() => handleCellFocus(0)}
            onBlur={handleCellBlur}
            tabIndex={0}
            fontSize="fontSizeS"
            fontWeight="fontWeightMedium"
            lineHeight="lineHeightS"
            fontColor="gray500">
            Display name
          </Text>
        </Table.Cell>
        <Table.Cell as="th" key={ENTRY_STATUS_COLUMN} style={styles.statusHeader}>
          <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
            <Text
              ref={statusRef}
              style={getTextStyle(1)}
              onFocus={() => handleCellFocus(1)}
              onBlur={handleCellBlur}
              tabIndex={0}
              fontSize="fontSizeS"
              fontWeight="fontWeightMedium"
              lineHeight="lineHeightS"
              fontColor="gray500">
              Status
            </Text>
            <Tooltip content="Bulk editing is not supported for Status" placement="top">
              <QuestionIcon size={16} aria-label="Bulk editing not supported for Status" />
            </Tooltip>
          </Flex>
        </Table.Cell>
        {fields.map((field, fieldIndex) => {
          const isAllowed = isCheckboxAllowed(field);
          const isDisabled = checkboxesDisabled[field.uniqueId];
          const columnIndex = 2 + fieldIndex; // +2 for display name and status columns

          if (isAllowed) {
            return (
              <Table.Cell as="th" key={field.uniqueId} style={styles.tableHeader} isTruncated>
                <Flex gap="spacingXs">
                  <Checkbox
                    ref={(el) => {
                      if (el) checkboxRefs.current.set(field.uniqueId, el);
                    }}
                    style={getCheckboxStyle(columnIndex)}
                    isChecked={headerCheckboxes[field.uniqueId]}
                    isDisabled={isDisabled}
                    onChange={(e) => onHeaderCheckboxChange(field.uniqueId, e.target.checked)}
                    onFocus={() => handleCellFocus(columnIndex)}
                    onBlur={handleCellBlur}
                    testId={`header-checkbox-${field.uniqueId}`}
                    aria-label={`Select all for ${truncate(field.name)}`}
                  />
                  <Text
                    ref={(el) => {
                      if (el) fieldRefs.current.set(field.uniqueId, el);
                    }}
                    style={getTextStyle(columnIndex)}
                    onFocus={() => handleCellFocus(columnIndex)}
                    onBlur={handleCellBlur}
                    tabIndex={0}
                    fontSize="fontSizeS"
                    fontWeight="fontWeightMedium"
                    lineHeight="lineHeightS">
                    {truncate(field.locale ? `(${field.locale}) ${field.name}` : field.name)}
                  </Text>
                </Flex>
              </Table.Cell>
            );
          }
          return (
            <Table.Cell as="th" key={field.uniqueId} style={styles.tableHeader}>
              <Flex gap="spacingXs">
                <Text
                  ref={(el) => {
                    if (el) fieldRefs.current.set(field.uniqueId, el);
                  }}
                  style={getTextStyle(columnIndex)}
                  onFocus={() => handleCellFocus(columnIndex)}
                  onBlur={handleCellBlur}
                  tabIndex={0}
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
