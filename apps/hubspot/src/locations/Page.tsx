import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Text,
  Spinner,
  Flex,
  Heading,
  Button,
  Badge,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { createClient } from 'contentful-management';
import ConfigEntryService from '../utils/ConfigEntryService';
import { styles } from './Page.styles';
import { ConnectedFields } from '../utils/utils';

const getStatusBadge = (entry: any) => {
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

const Page = () => {
  const sdk = useSDK();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedFields, setConnectedFields] = useState<ConnectedFields>({});
  const [displayFieldId, setDisplayFieldId] = useState('title');
  const [locale, setLocale] = useState('en-US');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const cma = createClient(
          { apiAdapter: sdk.cmaAdapter },
          {
            type: 'plain',
            defaults: {
              environmentId: sdk.ids.environment,
              spaceId: sdk.ids.space,
            },
          }
        );
        const configService = new ConfigEntryService(cma, sdk.locales.default);
        const connected = await configService.getConnectedFields();
        setConnectedFields(connected);
        setLocale(sdk.locales.default);
        let displayField = 'title';
        const entryIds = Object.keys(connected);
        if (entryIds.length === 0) {
          setEntries([]);
          setDisplayFieldId('title');
          setLoading(false);
          return;
        }
        const fetchedEntries = [];
        for (const entryId of entryIds) {
          try {
            const entry = await cma.entry.get({ entryId });
            fetchedEntries.push(entry);
            if (fetchedEntries.length === 1) {
              const ct = await cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
              displayField = ct.displayField || 'title';
            }
          } catch (e) {
            // skip missing entry
          }
        }
        setEntries(fetchedEntries);
        setDisplayFieldId(displayField);
      } catch (e) {
        setEntries([]);
        setError(
          'The app cannot load content. Try refreshing, or reviewing your app configuration.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sdk]);

  const handleManageFields = (entry: any) => {
    sdk.navigator.openEntry(entry.sys.id);
  };

  return (
    <Flex justifyContent="center" paddingLeft="spacing2Xl" paddingRight="spacing2Xl">
      <Box className={styles.container} padding="spacingL">
        <Heading as="h1" marginBottom="spacingM">
          Hubspot
        </Heading>
        <Text fontColor="gray600" marginBottom="spacingL">
          View the details of your synced entry fields. Click Manage fields to connect or disconnect
          content.
        </Text>
        {loading ? (
          <EmptyState />
        ) : error ? (
          <DisplayMessage
            title="The app cannot load content."
            message="Try refreshing, or reviewing your app configuration"
          />
        ) : entries.length === 0 ? (
          <DisplayMessage
            title="No active Hubspot modules"
            message="Once you have created modules, they will display here."
          />
        ) : (
          <ConnectedEntriesTable
            entries={entries}
            connectedFields={connectedFields}
            displayFieldId={displayFieldId}
            locale={locale}
            onManageFields={handleManageFields}
          />
        )}
      </Box>
    </Flex>
  );
};

const ConnectedEntriesTable = ({
  entries,
  connectedFields,
  displayFieldId,
  locale,
  onManageFields,
}: {
  entries: any[];
  connectedFields: ConnectedFields;
  displayFieldId: string;
  locale: string;
  onManageFields: (entry: any) => void;
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
        {entries.map((entry) => {
          const name = entry.fields?.[displayFieldId]?.[locale] || 'Untitled';
          const contentType = entry.sys.contentType.sys.name || entry.sys.contentType.sys.id;
          const updated = getLastUpdatedTime(entry.sys.updatedAt);
          const status = getStatusBadge(entry);
          const connected = connectedFields[entry.sys.id] || [];
          const connectedCount = connected.length;
          return (
            <Table.Row key={entry.sys.id}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>{contentType}</Table.Cell>
              <Table.Cell>{updated}</Table.Cell>
              <Table.Cell>{status}</Table.Cell>
              <Table.Cell>
                <Flex flexDirection="row" gap="spacingS" alignItems="center">
                  <Text>{connectedCount}</Text>
                </Flex>
              </Table.Cell>
              <Table.Cell className={styles.rightCell}>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onManageFields(entry)}
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

function EmptyState() {
  return (
    <Flex alignItems="center" justifyContent="center" className={styles.loading}>
      <Spinner size="large" />
      <Text marginLeft="spacingM">Loading...</Text>
    </Flex>
  );
}

type MessageProps = {
  title: string;
  message: string;
};
function DisplayMessage({ title, message }: MessageProps) {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      className={styles.emptyComponentContainer}>
      <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
        {title}
      </Text>
      <Text fontColor="gray600">{message}</Text>
    </Flex>
  );
}

export default Page;
