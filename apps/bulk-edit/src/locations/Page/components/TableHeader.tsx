import React from 'react';
import { Table, Checkbox, Flex } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@phosphor-icons/react';
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
          <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
            Status
            <Tooltip content="Bulk editing is not supported for Status" placement="top">
              <QuestionIcon size={16} aria-label="Bulk editing not supported for Status" />
            </Tooltip>
          </Flex>
        </Table.Cell>
        {fields.map((field, idx) => {
          const colIndex = idx + 2; // 0: display name, 1: status, 2+: fields
          const isDisabled = checkboxesDisabled[colIndex];
          if (isCheckboxAllowed(field)) {
            return (
              <Table.Cell as="th" key={field.id} style={styles.tableHeader} isTruncated>
                <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                  <Checkbox
                    isChecked={headerCheckboxes[colIndex]}
                    isDisabled={isDisabled}
                    onChange={(e) => onHeaderCheckboxChange(colIndex, e.target.checked)}
                    testId={`header-checkbox-${field.id}`}
                    aria-label={`Select all for ${truncate(field.name)}`}
                  />
                  {truncate(field.name)}
                </Flex>
              </Table.Cell>
            );
          }
          // Disabled field: add Question icon with tooltip
          return (
            <Table.Cell as="th" key={field.id} style={styles.tableHeader}>
              <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                {truncate(field.name)}
                <Tooltip
                  content={`Bulk editing is not supported for the ${field.name} field type`}
                  placement="top">
                  <QuestionIcon
                    size={16}
                    aria-label={`Bulk editing not supported for ${field.name}`}
                    tabIndex={0}
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
