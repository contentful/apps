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
          const columnIndex = idx + 2;
          const isAllowed = isCheckboxAllowed(field);
          const isDisabled = checkboxesDisabled[columnIndex];
          if (isAllowed) {
            return (
              <Table.Cell as="th" key={field.id} style={styles.tableHeader} isTruncated>
                <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                  <Checkbox
                    isChecked={headerCheckboxes[columnIndex]}
                    isDisabled={isDisabled}
                    onChange={(e) => onHeaderCheckboxChange(columnIndex, e.target.checked)}
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
              <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
                {truncate(field.name)}
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
