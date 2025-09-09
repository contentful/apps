import React, { useState } from 'react';
import { Table, TextLink, Badge, Checkbox, Flex, Text, Box } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import {
  getStatus,
  renderFieldValue,
  getEntryTitle,
  getEntryUrl,
  isCheckboxAllowed,
  truncate,
} from '../utils/entryUtils';
import { useTableCellFocus } from '../hooks/useTableCellFocus';

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
  rowIndex?: number;
  onCellFocus?: (rowIndex: number, columnIndex: number) => void;
  onRegisterFocusableElement?: (key: string, element: HTMLElement | null) => void;
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
  rowIndex = 0,
  onCellFocus,
  onRegisterFocusableElement,
}) => {
  const status = getStatus(entry);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [isBadgeFocused, setIsBadgeFocused] = useState(false);

  const displayField = contentType.displayField;
  const displayValue = displayField ? entry.fields[displayField]?.[defaultLocale] : entry.sys.id;

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
    rowIndex,
    onCellFocus,
    onRegisterFocusableElement,
  });

  return (
    <Table.Row key={entry.sys.id}>
      <Table.Cell
        testId="display-name-cell"
        style={styles.displayNameCell}
        onFocus={() => handleCellFocus(0)}>
        <TextLink
          ref={displayNameRef}
          href={getEntryUrl(entry, spaceId, environmentId)}
          target="_blank"
          rel="noopener noreferrer"
          testId="entry-link"
          icon={<ExternalLinkIcon />}
          alignIcon="end">
          {getEntryTitle(entry, contentType, defaultLocale)}
        </TextLink>
      </Table.Cell>
      <Table.Cell testId="status-cell" style={styles.statusCell} onFocus={() => handleCellFocus(1)}>
        <Badge
          ref={statusRef}
          style={{
            ...styles.statusBadge,
            ...(isBadgeFocused ? styles.focusedBadge : {}),
          }}
          variant={status.color}
          onFocus={() => {
            setIsBadgeFocused(true);
            handleCellFocus(1);
          }}
          onBlur={() => setIsBadgeFocused(false)}
          tabIndex={0}>
          {status.label}
        </Badge>
      </Table.Cell>
      {fields.map((field, fieldIndex) => {
        const isAllowed = isCheckboxAllowed(field);
        const isDisabled = cellCheckboxesDisabled[field.uniqueId];
        const isVisible =
          (hoveredColumn === field.uniqueId && !isDisabled) || rowCheckboxes[field.uniqueId];
        const columnIndex = 2 + fieldIndex; // +2 for display name and status columns

        if (isAllowed) {
          return (
            <Table.Cell
              key={field.uniqueId}
              style={styles.cell}
              onMouseEnter={() => setHoveredColumn(field.uniqueId)}
              onMouseLeave={() => setHoveredColumn(null)}
              onFocus={() => handleCellFocus(columnIndex)}
              isTruncated>
              <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                <Checkbox
                  ref={(el) => {
                    if (el) checkboxRefs.current.set(field.uniqueId, el);
                  }}
                  style={getCheckboxStyle(columnIndex)}
                  isChecked={rowCheckboxes[field.uniqueId]}
                  isDisabled={isDisabled}
                  onChange={(e) => onCellCheckboxChange(field.uniqueId, e.target.checked)}
                  onFocus={() => handleCellFocus(columnIndex)}
                  onBlur={handleCellBlur}
                  testId={`cell-checkbox-${field.uniqueId}`}
                  aria-label={`Select ${truncate(field.name)} for ${displayValue}`}
                />
                {renderFieldValue(field, entry.fields[field.id]?.[field.locale || defaultLocale])}
              </Flex>
            </Table.Cell>
          );
        }
        return (
          <Table.Cell
            key={field.uniqueId}
            style={styles.cell}
            onFocus={() => handleCellFocus(columnIndex)}>
            <Text
              ref={(el) => {
                if (el) fieldRefs.current.set(field.uniqueId, el);
              }}
              style={getTextStyle(columnIndex)}
              onFocus={() => handleCellFocus(columnIndex)}
              onBlur={handleCellBlur}
              tabIndex={0}
              fontColor="gray500">
              {renderFieldValue(field, entry.fields[field.id]?.[field.locale || defaultLocale])}
            </Text>
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
};
