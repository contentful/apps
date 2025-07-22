import { EntryProps, KeyValueMap } from 'contentful-management';
import { ConnectedFields, EntryWithContentType, getEntryTitle } from '../utils/utils';
import { Badge, Box, Button, Flex, Table, Text } from '@contentful/f36-components';
import { styles } from './ConnectedEntriesTable.styles';
import { WarningOctagonIcon } from '@phosphor-icons/react';

const getStatusBadge = (entry: EntryProps<KeyValueMap>) => {
  const isPublished = Boolean(entry.sys.publishedAt);
  return (
    <Badge variant={isPublished ? 'positive' : 'warning'}>
      {isPublished ? 'Published' : 'Draft'}
    </Badge>
  );
};

const getLastUpdatedTime = (dateString: string | undefined) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ConnectedEntriesTable = ({
  entries,
  connectedFields,
  defaultLocale,
  onManageFields,
}: {
  entries: EntryWithContentType[];
  connectedFields: ConnectedFields;
  defaultLocale: string;
  onManageFields: (entry: EntryWithContentType) => void;
}) => (
  <Box marginTop="spacingXl">
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Cell>
            <Text fontWeight="fontWeightDemiBold">Entry name</Text>
          </Table.Cell>
          <Table.Cell>
            <Text fontWeight="fontWeightDemiBold">Content type</Text>
          </Table.Cell>
          <Table.Cell>
            <Text fontWeight="fontWeightDemiBold">Updated</Text>
          </Table.Cell>
          <Table.Cell>
            <Text fontWeight="fontWeightDemiBold">Status</Text>
          </Table.Cell>
          <Table.Cell>
            <Text fontWeight="fontWeightDemiBold">Connected fields</Text>
          </Table.Cell>
          <Table.Cell className={styles.rightCell}>
            <Text fontColor="gray600" fontSize="fontSizeS">
              Connected entries: {entries.length}/25
            </Text>
          </Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {entries.map(({ entry, contentType }) => {
          const name = getEntryTitle(entry, contentType, defaultLocale);
          const contentTypeId = contentType.sys?.id;
          const updated = getLastUpdatedTime(entry.sys.updatedAt);
          const status = getStatusBadge(entry);
          const connected = connectedFields[entry.sys.id] || [];
          const connectedCount = connected.length;
          const hasErrors = Object.values(connected)?.some((field) => field.error);

          return (
            <Table.Row key={entry.sys.id}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>{contentTypeId}</Table.Cell>
              <Table.Cell>{updated}</Table.Cell>
              <Table.Cell>{status}</Table.Cell>
              <Table.Cell>
                <Flex flexDirection="row" gap="spacingS" alignItems="center">
                  <Text>{connectedCount}</Text>
                  {hasErrors && (
                    <Badge
                      variant="negative"
                      startIcon={<WarningOctagonIcon className={styles.warningIconBadge} />}>
                      Connection error
                    </Badge>
                  )}
                </Flex>
              </Table.Cell>
              <Table.Cell className={styles.rightCell}>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onManageFields({ entry, contentType })}
                  testId={`manage-fields-${entry.sys.id}`}>
                  Manage fields
                </Button>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  </Box>
);

export default ConnectedEntriesTable;
