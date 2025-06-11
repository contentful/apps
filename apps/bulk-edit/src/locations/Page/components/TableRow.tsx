import React, { useState } from 'react';
import { Table, TextLink, Badge, Checkbox, Flex, Text } from '@contentful/f36-components';
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
  const status = getStatus(entry);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const displayField = contentType.displayField;
  const displayValue = displayField ? entry.fields[displayField]?.[defaultLocale] : entry.sys.id;

  return (
    <Table.Row key={entry.sys.id}>
      <Table.Cell testId="display-name-cell" style={styles.stickyCell} isTruncated>
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
      <Table.Cell testId="status-cell" style={styles.cell}>
        <Badge variant={status.color}>{status.label}</Badge>
      </Table.Cell>
      {fields.map((field) => {
        const isAllowed = isCheckboxAllowed(field);
        const isDisabled = cellCheckboxesDisabled[field.id];
        const isVisible = (hoveredColumn === field.id && !isDisabled) || rowCheckboxes[field.id];

        if (isAllowed) {
          return (
            <Table.Cell
              key={field.id}
              style={styles.cell}
              onMouseEnter={() => setHoveredColumn(field.id)}
              onMouseLeave={() => setHoveredColumn(null)}
              isTruncated>
              <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                {isVisible && (
                  <Checkbox
                    isChecked={rowCheckboxes[field.id]}
                    isDisabled={isDisabled}
                    onChange={(e) => onCellCheckboxChange(field.id, e.target.checked)}
                    testId={`cell-checkbox-${field.id}`}
                    aria-label={`Select ${truncate(field.name)} for ${displayValue}`}
                  />
                )}
                {renderFieldValue(field, entry.fields[field.id]?.[defaultLocale])}
              </Flex>
            </Table.Cell>
          );
        }
        return (
          <Table.Cell key={field.id} style={styles.cell}>
            <Text fontColor="gray500">
              {renderFieldValue(field, entry.fields[field.id]?.[defaultLocale])}
            </Text>
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
};
