import React, { useEffect, useState } from 'react';
import { Box, Text, Spinner, Flex, Heading } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { createClient, EntryProps, KeyValueMap } from 'contentful-management';
import ConfigEntryService from '../utils/ConfigEntryService';
import { styles } from './Page.styles';
import { ConnectedFields } from '../utils/utils';
import ConnectedEntriesTable from '../components/ConnectedEntriesTable';

const Page = () => {
  const sdk = useSDK();
  const [entries, setEntries] = useState<EntryProps<KeyValueMap>[]>([]);
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

  const handleManageFields = (entry: EntryProps<KeyValueMap>) => {
    // todo : implement
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
