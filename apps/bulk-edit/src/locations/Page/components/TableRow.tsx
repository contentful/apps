import React from 'react';
import { Table, TextLink, Badge } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';
import { getStatus, renderFieldValue, getEntryTitle, getEntryUrl } from '../utils/entryUtils';

interface TableRowProps {
  entry: Entry;
  fields: ContentTypeField[];
  contentType?: ContentTypeProps;
  spaceId: string;
  environmentId: string;
  locale: string;
}

export const TableRow: React.FC<TableRowProps> = ({
  entry,
  fields,
  contentType,
  spaceId,
  environmentId,
  locale,
}) => {
  const status = getStatus(entry);

  return (
    <Table.Row key={entry.sys.id}>
      {fields.length > 0 && (
        <Table.Cell testId="display-name-cell" style={styles.stickyCell}>
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
      {fields.map((field) => (
        <Table.Cell key={field.id} style={styles.cell}>
          {renderFieldValue(field, entry.fields[field.id]?.[locale])}
        </Table.Cell>
      ))}
    </Table.Row>
  );
};
