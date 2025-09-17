import React, { useState } from 'react';
import { Table, TextLink, Badge, Checkbox, Flex, Text } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import {
  getStatusFromEntry,
  renderFieldValue,
  getEntryTitle,
  getEntryUrl,
  isCheckboxAllowed,
  truncate,
  getStatusColor,
} from '../utils/entryUtils';

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
}) => {
  const status = getStatusFromEntry(entry);
  const statusColor = getStatusColor(status);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const displayField = contentType.displayField;
  const displayValue = displayField ? entry.fields[displayField]?.[defaultLocale] : entry.sys.id;

  return (
    <Table.Row key={entry.sys.id}>
      <Table.Cell testId="display-name-cell" style={styles.displayNameCell}>
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
      <Table.Cell testId="status-cell" style={styles.statusCell}>
        <Badge variant={statusColor}>{status}</Badge>
      </Table.Cell>
      {fields.map((field) => {
        const isAllowed = isCheckboxAllowed(field);
        const isDisabled = cellCheckboxesDisabled[field.uniqueId];
        const isVisible =
          (hoveredColumn === field.uniqueId && !isDisabled) || rowCheckboxes[field.uniqueId];

        if (isAllowed) {
          return (
            <Table.Cell
              key={field.uniqueId}
              style={styles.cell}
              onMouseEnter={() => setHoveredColumn(field.uniqueId)}
              onMouseLeave={() => setHoveredColumn(null)}
              isTruncated>
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
                {renderFieldValue(field, entry.fields[field.id]?.[field.locale || defaultLocale])}
              </Flex>
            </Table.Cell>
          );
        }
        return (
          <Table.Cell key={field.uniqueId} style={styles.cell}>
            <Text fontColor="gray500">
              {renderFieldValue(field, entry.fields[field.id]?.[field.locale || defaultLocale])}
            </Text>
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
};
