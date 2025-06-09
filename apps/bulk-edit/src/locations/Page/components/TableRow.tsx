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
} from '../utils/entryUtils';

interface TableRowProps {
  entry: Entry;
  fields: ContentTypeField[];
  contentType?: ContentTypeProps;
  spaceId: string;
  environmentId: string;
  locale: string;
  rowCheckboxes: boolean[];
  onCellCheckboxChange: (rowId: string, colIndex: number, checked: boolean) => void;
  cellCheckboxesVisible: boolean[];
  cellCheckboxesDisabled: boolean[];
  headerCheckboxes: boolean[];
}

export const TableRow: React.FC<TableRowProps> = ({
  entry,
  fields,
  contentType,
  spaceId,
  environmentId,
  locale,
  rowCheckboxes,
  onCellCheckboxChange,
  cellCheckboxesVisible,
  cellCheckboxesDisabled,
  headerCheckboxes,
}) => {
  const status = getStatus(entry);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  return (
    <Table.Row key={entry.sys.id}>
      {fields.length > 0 && (
        <Table.Cell testId="display-name-cell" style={styles.stickyCell} isTruncated>
          <TextLink
            href={getEntryUrl(entry, spaceId, environmentId)}
            target="_blank"
            rel="noopener noreferrer"
            testId="entry-link"
            icon={<ExternalLinkIcon />}
            alignIcon="end">
            {getEntryTitle(entry, fields, contentType, locale)}
          </TextLink>
        </Table.Cell>
      )}
      <Table.Cell testId="status-cell" style={styles.cell}>
        <Badge variant={status.color}>{status.label}</Badge>
      </Table.Cell>
      {fields.map((field, idx) => {
        const colIndex = idx + 2; // 0: display name, 1: status, 2+: fields
        if (isCheckboxAllowed(field)) {
          const isChecked = rowCheckboxes[colIndex];
          // Show checkbox if: header is checked, cell is checked, or hovered
          const showCheckbox =
            cellCheckboxesVisible[colIndex] ||
            isChecked ||
            headerCheckboxes[colIndex] ||
            hoveredCol === colIndex;
          return (
            <Table.Cell
              key={field.id}
              style={styles.cell}
              onMouseEnter={() => setHoveredCol(colIndex)}
              onMouseLeave={() => setHoveredCol(null)}
              isTruncated>
              <Flex gap="spacingXs" alignItems="center">
                <Checkbox
                  isChecked={isChecked}
                  isDisabled={cellCheckboxesDisabled[colIndex]}
                  onChange={(e) => onCellCheckboxChange(entry.sys.id, colIndex, e.target.checked)}
                  inputProps={{ 'data-test-id': `cell-checkbox-${entry.sys.id}-${field.id}` }}
                  aria-label={`Select for ${field.name}`}
                  style={{ display: showCheckbox ? undefined : 'none' }}
                />
                {renderFieldValue(field, entry.fields[field.id]?.[locale])}
              </Flex>
            </Table.Cell>
          );
        }
        // Disabled cell: render value in gray500
        return (
          <Table.Cell key={field.id} style={styles.cell}>
            <Text fontColor="gray500">
              {renderFieldValue(field, entry.fields[field.id]?.[locale])}
            </Text>
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
};
