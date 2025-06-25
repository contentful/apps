import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Text,
  Badge,
  Spinner,
  Button,
  Flex,
  Heading,
  Subheading,
  Modal,
  Checkbox,
  Stack,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { fetchBrazeConnectedEntries } from '../utils/fetchBrazeConnectedEntries';
import InformationWithLink from '../components/InformationWithLink';
import { styles } from './Page.styles';
import Splitter from '../components/Splitter';
import { createClient, EntryProps } from 'contentful-management';
import { Entry } from '../fields/Entry';
import {
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  CONFIG_FIELD_ID,
  ConnectedFields,
  EntryConnectedFields,
  getConfigEntry,
  localizeFieldId,
  updateConfig,
} from '../utils';
import WarningOctagonIcon from '../components/WarningOctagonIcon';

const getStatusBadge = (status: string) => {
  if (status.toLowerCase() === 'published') {
    return <Badge variant="positive">Published</Badge>;
  }
  return <Badge variant="warning">Draft</Badge>;
};

const getLastUpdatedTime = (dateString: string | undefined) => {
  if (!dateString) {
    return '-';
  }
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

function LoadingState() {
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

function ConnectedFieldsModal({
  entry,
  isShown,
  onClose,
  onViewEntry,
  onDisconnect,
  entryConnectedFields,
}: {
  entry: Entry;
  isShown: boolean;
  onClose: () => void;
  onViewEntry: () => void;
  onDisconnect: (selectedFieldIds: string[], entry: Entry) => void;
  entryConnectedFields: EntryConnectedFields;
}) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set());
  const allFieldIds = entryConnectedFields.map((field) =>
    localizeFieldId(field.fieldId, field.locale)
  );
  const allSelected = allFieldIds.every((id) => selectedFields.has(id));
  const someSelected = allFieldIds.some((id) => selectedFields.has(id));
  const fieldsWithErrors = entryConnectedFields.filter((field) => field.error);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(allFieldIds));
    }
  };

  const handleFieldToggle = (id: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDisconnect = async () => {
    onDisconnect(Array.from(selectedFields), entry);
    setSelectedFields(new Set());
  };

  const getFieldDisplayName = (fieldId: string, locale?: string) => {
    const field = entry.fields.find((f) => f.id === fieldId);
    if (!field) return fieldId;
    const displayName = field.displayNameForCreate();
    return locale ? `${displayName} (${locale})` : displayName;
  };

  return (
    <Modal isShown={isShown} onClose={onClose} size="medium" testId="connected-fields-modal">
      {() => (
        <>
          <Modal.Header title="Connected fields" onClose={onClose} />
          <Modal.Content>
            <Box className={styles.modalMainContainer}>
              {fieldsWithErrors.length > 0 && (
                <Box>
                  {fieldsWithErrors.map((field, index) => (
                    <Box key={`${field.fieldId}-${index}`} className={styles.modalErrorBanner}>
                      <span className={styles.modalErrorTitle}>
                        {`"${getFieldDisplayName(field.fieldId, field.locale)}" connection error`}
                      </span>
                      <span className={styles.modalErrorMessage}>
                        Error code {field.error?.status} - {field.error?.message}
                      </span>
                    </Box>
                  ))}
                </Box>
              )}
              <Box className={styles.modalEntryContainer}>
                <Flex flexDirection="column">
                  <Text fontColor="gray600" marginBottom="spacing2Xs">
                    Entry name
                  </Text>
                  <Text data-testid="modal-entry-title" fontWeight="fontWeightDemiBold">
                    {entry.title}
                  </Text>
                </Flex>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={onViewEntry}
                  className={styles.viewEntryButton}>
                  View entry
                </Button>
              </Box>
              {selectedFields.size > 0 && (
                <Stack
                  flexDirection="column"
                  spacing="spacing2Xs"
                  marginBottom="spacingM"
                  alignItems="start">
                  <Text fontColor="gray600">{selectedFields.size} selected</Text>
                  <Button variant="negative" size="small" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </Stack>
              )}
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Cell className={styles.checkboxCell}>
                      <Checkbox
                        isChecked={allSelected}
                        isIndeterminate={!allSelected && someSelected}
                        onChange={handleSelectAll}
                        data-testid="select-all-fields"
                        aria-label="Select all fields"
                      />
                    </Table.Cell>
                    <Table.Cell className={styles.baseCell}>
                      <Text fontColor="gray600">
                        Select all fields ({entryConnectedFields.length})
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {entryConnectedFields.map((field, index) => {
                    const fieldId = localizeFieldId(field.fieldId, field.locale);
                    return (
                      <Table.Row key={`${fieldId}-${index}`}>
                        <Table.Cell className={styles.checkboxCell}>
                          <Checkbox
                            isChecked={selectedFields.has(fieldId)}
                            onChange={() => handleFieldToggle(fieldId)}
                            aria-label={getFieldDisplayName(field.fieldId, field.locale)}
                          />
                        </Table.Cell>
                        <Table.Cell className={styles.baseCell}>
                          <Flex flexDirection="row" gap="spacingXs">
                            <Text fontWeight="fontWeightDemiBold">
                              {getFieldDisplayName(field.fieldId, field.locale)}
                            </Text>
                            {field.error && (
                              <Badge
                                variant="negative"
                                startIcon={
                                  <WarningOctagonIcon />
                                }>{`Error code ${field.error?.status}`}</Badge>
                            )}
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" size="small" onClick={onClose}>
              Close
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

function ConnectedEntriesTable({
  entries,
  onViewFields,
  configEntry,
}: {
  entries: Entry[];
  onViewFields: (entry: Entry) => void;
  configEntry: EntryProps | null;
}) {
  function getConnectedEntries(): ConnectedFields {
    if (!configEntry) return {};
    const configField = configEntry.fields[CONFIG_FIELD_ID];
    return Object.values(configField)[0] as ConnectedFields;
  }

  const getConnectedFieldsCount = (entry: Entry) => {
    const connectedFields = getConnectedEntries()[entry.id];
    return connectedFields?.length || 0;
  };

  return (
    <Box marginTop="spacingXl">
      <Flex justifyContent="end" alignItems="center" marginBottom="spacingXs">
        <Text fontColor="gray600" fontSize="fontSizeS">
          Connected entries: {entries.length}/25
        </Text>
      </Flex>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Entry name</Table.Cell>
            <Table.Cell>Content type</Table.Cell>
            <Table.Cell>Updated</Table.Cell>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Connected fields</Table.Cell>
            <Table.Cell align="center" className={styles.buttonCell} />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {entries.map((entry) => {
            const name = entry.title;
            const contentType = entry.contentType;
            const updated = getLastUpdatedTime(entry.updatedAt);
            const status = entry.state;
            const connectedCount = getConnectedFieldsCount(entry);
            const connectedFields = getConnectedEntries()[entry.id];
            const hasErrors = connectedFields?.some((field) => field.error);

            return (
              <Table.Row key={entry.id}>
                <Table.Cell>{name}</Table.Cell>
                <Table.Cell>{contentType}</Table.Cell>
                <Table.Cell>{updated}</Table.Cell>
                <Table.Cell>{getStatusBadge(status)}</Table.Cell>
                <Table.Cell>
                  <Flex flexDirection="row" gap="spacingM">
                    {connectedCount}
                    {hasErrors && (
                      <Badge variant="negative" startIcon={<WarningOctagonIcon />}>
                        Connection error
                      </Badge>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell align="center" className={styles.buttonCell}>
                  <Button variant="secondary" size="small" onClick={() => onViewFields(entry)}>
                    View fields
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Box>
  );
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalEntry, setModalEntry] = useState<Entry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [configEntry, setConfigEntry] = useState<EntryProps | null>(null);
  const [entryConnectedFields, setEntryConnectedFields] = useState<EntryConnectedFields>([]);

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

  const loadEntries = async () => {
    setLoading(true);
    try {
      const config = await getConfigEntry(cma);
      setConfigEntry(config);
      const entries = await fetchBrazeConnectedEntries(
        cma,
        sdk.parameters?.installation?.contentfulApiKey,
        sdk.ids.space,
        sdk.ids.environment,
        sdk.locales.default,
        config
      );
      setEntries(entries);
    } catch (error) {
      setError('Error loading connected entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const hasConnectedEntries = () => {
    return entries.length > 0;
  };

  const handleViewFields = (entry: Entry) => {
    setModalEntry(entry);
    if (configEntry) {
      const configField = configEntry.fields[CONFIG_FIELD_ID];
      const connectedFields = Object.values(configField)[0] as ConnectedFields;
      setEntryConnectedFields(connectedFields[entry.id] || []);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalEntry(null);
    setEntryConnectedFields([]);
  };

  const handleViewEntry = () => {
    if (modalEntry) {
      sdk.navigator.openEntry(modalEntry.id);
    }
  };

  const handleDisconnectFields = async (selectedFieldIds: string[], entry: Entry) => {
    if (!configEntry) return;

    const configField = configEntry.fields[CONFIG_FIELD_ID];
    const connectedFields = Object.values(configField)[0] as ConnectedFields;
    const entryConnectedFields = connectedFields[entry.id];

    const isNotSelectedField = (field: {
      fieldId: string;
      locale?: string;
      contentBlockId?: string;
    }) => !selectedFieldIds.includes(localizeFieldId(field.fieldId, field.locale));

    if (entryConnectedFields.length === selectedFieldIds.length) {
      delete connectedFields[entry.id];
    } else if (entryConnectedFields.length > selectedFieldIds.length) {
      connectedFields[entry.id] = entryConnectedFields.filter(isNotSelectedField);
    }

    await updateConfig(configEntry, connectedFields, cma);
    setModalOpen(false);
    setShowSuccess(true);
  };

  const handleCloseSuccess = async () => {
    setShowSuccess(false);
    await loadEntries();
  };

  return (
    <Flex justifyContent="center" paddingLeft="spacing2Xl" paddingRight="spacing2Xl">
      <Box className={styles.container}>
        <Heading
          as="h1"
          marginTop="spacingS"
          marginBottom="spacingS"
          marginRight="spacingM"
          marginLeft="spacingM">
          Braze Content Blocks
        </Heading>
        <Splitter />
        <Box padding="spacingL">
          {hasConnectedEntries() && (
            <>
              <Subheading className={styles.subheading}>
                Content connected to Braze through Content Blocks
              </Subheading>
              <InformationWithLink
                url={BRAZE_CONTENT_BLOCK_DOCUMENTATION}
                linkText="here"
                dataTestId="help-here">
                Learn more about Braze Content Blocks
              </InformationWithLink>
            </>
          )}
          <Box>
            {loading ? (
              <LoadingState />
            ) : error ? (
              <DisplayMessage title="There was an error" message="Please contact support" />
            ) : !hasConnectedEntries() ? (
              <DisplayMessage
                title="No active Braze Content Blocks"
                message="Once you have created Content Blocks, they will display here."
              />
            ) : (
              <ConnectedEntriesTable
                entries={entries}
                onViewFields={handleViewFields}
                configEntry={configEntry}
              />
            )}
            {modalEntry && (
              <ConnectedFieldsModal
                entry={modalEntry}
                isShown={modalOpen}
                onClose={handleCloseModal}
                onViewEntry={handleViewEntry}
                onDisconnect={handleDisconnectFields}
                entryConnectedFields={entryConnectedFields}
              />
            )}
            {showSuccess && (
              <Modal isShown={showSuccess} onClose={handleCloseSuccess} size="small">
                {() => (
                  <>
                    <Modal.Header title="Disconnect from Braze" onClose={handleCloseSuccess} />
                    <Modal.Content>
                      <Text>Fields successfully disconnected from Braze.</Text>
                    </Modal.Content>
                    <Modal.Controls>
                      <Button variant="secondary" size="small" onClick={handleCloseSuccess}>
                        Close
                      </Button>
                    </Modal.Controls>
                  </>
                )}
              </Modal>
            )}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Page;
