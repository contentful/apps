import React, { useEffect, useState } from 'react';
import { Box, Flex, Heading, Spinner, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps, createClient, EntryProps, KeyValueMap } from 'contentful-management';
import ConfigEntryService from '../utils/ConfigEntryService';
import { styles } from './Page.styles';
import { ConnectedFields } from '../utils/utils';
import ConnectedEntriesTable from '../components/ConnectedEntriesTable';
import DisplayMessage from '../components/DisplayMessage';
import ConnectedFieldsModal from '../components/ConnectedFieldsModal';

const Page = () => {
  const sdk = useSDK();
  const [entries, setEntries] = useState<
    { entry: EntryProps<KeyValueMap>; contentType: ContentTypeProps }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedFields, setConnectedFields] = useState<ConnectedFields>({});
  const [locale, setLocale] = useState('en-US');
  const [modalEntry, setModalEntry] = useState<{
    entry: EntryProps<KeyValueMap>;
    contentType: ContentTypeProps;
  } | null>(null);
  const [modalEntryDefaultLocale, setModalEntryDefaultLocale] = useState<string>('en-US');
  const [modalOpen, setModalOpen] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const configService = new ConfigEntryService(cma, sdk.locales.default);
        const connected = await configService.getConnectedFields();
        setConnectedFields(connected);
        setLocale(sdk.locales.default);
        const entryIds = Object.keys(connected);
        if (entryIds.length === 0) {
          setEntries([]);
          setLoading(false);
          return;
        }

        const fetchedEntries = [];
        try {
          const entries = await cma.entry.getMany({
            query: { 'sys.id[in]': entryIds },
          });
          for (const entry of entries.items) {
            const ct = await cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
            fetchedEntries.push({ entry, contentType: ct });
          }
        } catch (e) {
          // skip missing entry
        }
        setEntries(fetchedEntries);
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

  const handleManageFields = async (entry: {
    entry: EntryProps<KeyValueMap>;
    contentType: ContentTypeProps;
  }) => {
    setModalEntry(entry);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalEntryDefaultLocale(sdk.locales.default);
    setModalOpen(false);
    setModalEntry(null);
  };

  const handleViewEntry = () => {
    if (modalEntry) {
      sdk.navigator.openEntry(modalEntry.entry.sys.id);
    }
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
          <Flex alignItems="center" justifyContent="center" className={styles.loading}>
            <Spinner size="large" />
            <Text marginLeft="spacingM">Loading...</Text>
          </Flex>
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
            locale={locale}
            onManageFields={handleManageFields}
          />
        )}
        {modalEntry && (
          <ConnectedFieldsModal
            entry={modalEntry}
            isShown={modalOpen}
            onClose={handleCloseModal}
            onViewEntry={handleViewEntry}
            entryConnectedFields={connectedFields[modalEntry.entry.sys.id]}
            defaultLocale={modalEntryDefaultLocale}
          />
        )}
      </Box>
    </Flex>
  );
};

export default Page;
