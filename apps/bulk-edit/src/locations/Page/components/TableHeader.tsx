import React from 'react';
import { Table, Checkbox, Flex } from '@contentful/f36-components';
import { ContentTypeField } from '../types';
import { styles } from '../styles';
import { truncate, isCheckboxAllowed } from '../utils/entryUtils';

interface TableHeaderProps {
  fields: ContentTypeField[];
  headerCheckboxes: boolean[];
  onHeaderCheckboxChange: (colIndex: number, checked: boolean) => void;
  checkboxesDisabled: boolean[];
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  headerCheckboxes,
  onHeaderCheckboxChange,
  checkboxesDisabled,
}) => {
  return (
    <Table.Head style={styles.tableHead}>
      <Table.Row>
        {fields.length > 0 && (
          <Table.Cell as="th" key="displayName" style={styles.stickyTableHeader}>
            Display name
          </Table.Cell>
        )}
        <Table.Cell as="th" key="status" style={styles.tableHeader}>
          Status
        </Table.Cell>
        {fields.map((field, idx) => {
          const colIndex = idx + 2; // 0: display name, 1: status, 2+: fields
          if (isCheckboxAllowed(field)) {
            return (
              <Table.Cell as="th" key={field.id} style={styles.tableHeader} isTruncated>
                <Flex gap="spacingXs" alignItems="center">
                  <Checkbox
                    isChecked={headerCheckboxes[colIndex]}
                    isDisabled={checkboxesDisabled[colIndex]}
                    onChange={(e) => onHeaderCheckboxChange(colIndex, e.target.checked)}
                    testId={`header-checkbox-${field.id}`}
                    aria-label={`Select all for ${truncate(field.name)}`}
                  />
                  {truncate(field.name)}
                </Flex>
              </Table.Cell>
            );
          }
          return (
            <Table.Cell as="th" key={field.id} style={styles.tableHeader}>
              {truncate(field.name)}
            </Table.Cell>
          );
        })}
      </Table.Row>
    </Table.Head>
  );
};
