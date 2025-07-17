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

interface EntryWithContentType {
  entry: EntryProps<KeyValueMap>;
  contentType: ContentTypeProps;
}

const Page: React.FC = () => {
  const sdk = useSDK();
  const [entriesWithContentType, setEntriesWithContentType] = useState<EntryWithContentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedFields, setConnectedFields] = useState<ConnectedFields>({});
  const defaultLocale = sdk.locales.default;
  const [modalEntry, setModalEntry] = useState<EntryWithContentType | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

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
    const fetchConnectedEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const configService = new ConfigEntryService(cma, defaultLocale);
        const connectedFields = await configService.getConnectedFields();
        setConnectedFields(connectedFields);
        const entryIds = Object.keys(connectedFields);
        if (entryIds.length === 0) {
          setEntriesWithContentType([]);
          setLoading(false);
          return;
        }

        const entriesResponse = await cma.entry.getMany({ query: { 'sys.id[in]': entryIds } });
        const fetchEntriesWithContentType = await Promise.all(
          entriesResponse.items.map(async (entry) => {
            try {
              const contentType = await cma.contentType.get({
                contentTypeId: entry.sys.contentType.sys.id,
              });
              return { entry, contentType };
            } catch (err) {
              return null;
            }
          })
        );

        setEntriesWithContentType(fetchEntriesWithContentType.filter((e) => e !== null));
      } catch (e) {
        setEntriesWithContentType([]);
        setError(
          'The app cannot load content. Try refreshing, or reviewing your app configuration.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchConnectedEntries();
  }, [sdk]);

  function handleManageFields(entry: EntryWithContentType) {
    setModalEntry(entry);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setModalEntry(null);
  }

  function handleViewEntry() {
    if (modalEntry) {
      sdk.navigator.openEntry(modalEntry.entry.sys.id);
    }
  }

  const connectedFieldsForEntry = modalEntry ? connectedFields[modalEntry.entry.sys.id] : undefined;

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
            message="Try refreshing, or reviewing your app configuration."
          />
        ) : entriesWithContentType.length === 0 ? (
          <DisplayMessage
            title="No active Hubspot modules"
            message="Once you have created modules, they will display here."
          />
        ) : (
          <ConnectedEntriesTable
            entries={entriesWithContentType}
            connectedFields={connectedFields}
            defaultLocale={defaultLocale}
            onManageFields={handleManageFields}
          />
        )}
        {modalEntry && connectedFieldsForEntry && (
          <ConnectedFieldsModal
            entry={modalEntry}
            isShown={modalOpen}
            onClose={handleCloseModal}
            onViewEntry={handleViewEntry}
            entryConnectedFields={connectedFieldsForEntry}
            defaultLocale={defaultLocale}
          />
        )}
      </Box>
    </Flex>
  );
};

export default Page;
