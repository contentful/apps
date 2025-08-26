import React from 'react';
import { Table, Checkbox, Flex, Text, Box } from '@contentful/f36-components';
import { Tooltip } from '@contentful/f36-tooltip';
import { QuestionIcon } from '@phosphor-icons/react';
import { ContentTypeField } from '../types';
import { styles } from '../styles';
import { truncate, isCheckboxAllowed } from '../utils/entryUtils';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from '../utils/constants';

interface TableHeaderProps {
  fields: ContentTypeField[];
  headerCheckboxes: Record<string, boolean>;
  onHeaderCheckboxChange: (columnId: string, checked: boolean) => void;
  checkboxesDisabled: Record<string, boolean>;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  headerCheckboxes,
  onHeaderCheckboxChange,
  checkboxesDisabled,
}) => {
  return (
    <Table.Head style={styles.tableHead}>
      <Table.Row style={styles.stickyTableRow}>
        {fields.length > 0 && (
          <Table.Cell as="th" key={DISPLAY_NAME_COLUMN} style={styles.stickyTableHeader}>
            Display name
          </Table.Cell>
        )}
        <Table.Cell as="th" key={ENTRY_STATUS_COLUMN} style={styles.tableHeader}>
          <Flex gap="spacingXs" alignItems="center" justifyContent="flex-start">
            Status
            <Tooltip content="Bulk editing is not supported for Status" placement="top">
              <QuestionIcon size={16} aria-label="Bulk editing not supported for Status" />
            </Tooltip>
          </Flex>
        </Table.Cell>
        {fields.map((field) => {
          const isAllowed = isCheckboxAllowed(field);
          const isDisabled = checkboxesDisabled[field.uniqueId];

          if (isAllowed) {
            return (
              <Table.Cell as="th" key={field.uniqueId} style={styles.tableHeader} isTruncated>
                <Flex gap="spacingXs">
                  <Checkbox
                    isChecked={headerCheckboxes[field.uniqueId]}
                    isDisabled={isDisabled}
                    onChange={(e) => onHeaderCheckboxChange(field.uniqueId, e.target.checked)}
                    testId={`header-checkbox-${field.uniqueId}`}
                    aria-label={`Select all for ${truncate(field.name)}`}
                  />
                  <Text
                    fontSize="fontSizeS"
                    fontWeight="fontWeightMedium"
                    lineHeight="lineHeightS"
                    fontColor="gray900">
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
