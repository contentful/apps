import React from 'react';
import { Table } from '@contentful/f36-components';
import { ContentTypeField } from '../types';
import { styles } from '../styles';
import { truncate } from '../utils/entryUtils';

interface TableHeaderProps {
  fields: ContentTypeField[];
}

export const TableHeader: React.FC<TableHeaderProps> = ({ fields }) => {
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
        {fields.map((field) => (
          <Table.Cell as="th" key={field.id} style={styles.tableHeader}>
            {truncate(field.name)}
          </Table.Cell>
        ))}
      </Table.Row>
    </Table.Head>
  );
};
