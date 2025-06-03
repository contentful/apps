import React, { useState, useEffect, useCallback } from 'react';
import {
  Paragraph,
  Button,
  Select,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextInput,
  Checkbox,
  Stack,
  Heading,
  Card,
  Notification,
  Spinner,
  Badge,
  Flex,
  Box,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

interface ContentType {
  sys: {
    id: string;
  };
  name: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    required?: boolean;
  }>;
}

interface Entry {
  sys: {
    id: string;
    version: number;
    publishedVersion?: number;
  };
  fields: Record<string, any>;
  metadata?: {
    tags: Array<{ sys: { id: string } }>;
  };
}

interface BulkUpdate {
  fieldId: string;
  value: any;
  enabled: boolean;
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const cma = useCMA();

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [bulkUpdates, setBulkUpdates] = useState<Record<string, BulkUpdate>>({});
  const [loading, setLoading] = useState(false);
  const [currentContentType, setCurrentContentType] = useState<ContentType | null>(null);
  const [lastUpdateBackup, setLastUpdateBackup] = useState<Record<string, Entry>>({});

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    if (type === 'success') {
      Notification.success(message);
    } else if (type === 'error') {
      Notification.error(message);
    } else if (type === 'warning') {
      Notification.warning(message);
    }
  };

  // Show success notification with undo button
  const showSuccessWithUndo = (message: string, onUndo: () => void) => {
    Notification.success(message, {
      duration: 10000, // 10 seconds
      cta: {
        label: 'Undo',
        textLinkProps: {
          variant: 'primary',
          onClick: onUndo,
        },
      },
    });
  };

  // Fetch content types on component mount
  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        setLoading(true);
        const response = await cma.contentType.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment || 'master',
        });
        setContentTypes(response.items);
      } catch (error) {
        console.error('Error fetching content types:', error);
        showNotification('error', 'Failed to fetch content types');
      } finally {
        setLoading(false);
      }
    };

    fetchContentTypes();
  }, [cma, sdk.ids.space, sdk.ids.environment]);

  // Fetch entries when content type is selected
  const fetchEntries = useCallback(
    async (contentTypeId: string) => {
      try {
        setLoading(true);
        setEntries([]);
        setSelectedEntries(new Set());

        const [entriesResponse, contentTypeResponse] = await Promise.all([
          cma.entry.getMany({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment || 'master',
            query: {
              content_type: contentTypeId,
              limit: 100,
            },
          }),
          cma.contentType.get({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment || 'master',
            contentTypeId,
          }),
        ]);

        setEntries(entriesResponse.items);
        setCurrentContentType(contentTypeResponse);

        // Initialize bulk updates for each field
        const initialBulkUpdates: Record<string, BulkUpdate> = {};
        contentTypeResponse.fields.forEach((field) => {
          initialBulkUpdates[field.id] = {
            fieldId: field.id,
            value: '',
            enabled: false,
          };
        });
        setBulkUpdates(initialBulkUpdates);
      } catch (error) {
        console.error('Error fetching entries:', error);
        showNotification('error', 'Failed to fetch entries');
      } finally {
        setLoading(false);
      }
    },
    [cma, sdk.ids.space, sdk.ids.environment]
  );

  // Handle content type selection
  const handleContentTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedContentType(value);
    if (value) {
      fetchEntries(value);
    }
  };

  // Toggle entry selection
  const toggleEntrySelection = (entryId: string) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntries(newSelection);
  };

  // Select all entries
  const selectAllEntries = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map((entry) => entry.sys.id)));
    }
  };

  // Update bulk update value
  const updateBulkValue = (fieldId: string, value: any) => {
    setBulkUpdates((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value,
      },
    }));
  };

  // Toggle bulk update enabled state
  const toggleBulkUpdate = (fieldId: string) => {
    setBulkUpdates((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        enabled: !prev[fieldId].enabled,
      },
    }));
  };

  // Apply bulk updates
  const applyBulkUpdates = async () => {
    if (selectedEntries.size === 0) {
      showNotification('warning', 'Please select at least one entry to update');
      return;
    }

    const enabledUpdates = Object.values(bulkUpdates).filter((update) => update.enabled);
    if (enabledUpdates.length === 0) {
      showNotification('warning', 'Please enable at least one field to update');
      return;
    }

    try {
      setLoading(true);

      // Create backups before making changes
      const backups: Record<string, Entry> = {};

      const updatePromises = Array.from(selectedEntries).map(async (entryId) => {
        const entry = entries.find((e) => e.sys.id === entryId);
        if (!entry) return;

        // Get the latest version of the entry
        const latestEntry = await cma.entry.get({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment || 'master',
          entryId,
        });
        console.log('latestEntry', latestEntry);

        // Store backup of current state
        backups[entryId] = { ...latestEntry };

        // Apply bulk updates
        const updatedFields = { ...latestEntry.fields };
        enabledUpdates.forEach((update) => {
          const field = currentContentType?.fields.find((f) => f.id === update.fieldId);
          if (field) {
            // Handle different field types
            if (field.type === 'Symbol' || field.type === 'Text') {
              updatedFields[update.fieldId] = {
                'en-US': update.value,
              };
            } else if (field.type === 'Integer' || field.type === 'Number') {
              updatedFields[update.fieldId] = {
                'en-US': Number(update.value),
              };
            } else if (field.type === 'Boolean') {
              updatedFields[update.fieldId] = {
                'en-US': Boolean(update.value),
              };
            } else {
              // For other types, try to set the value directly
              updatedFields[update.fieldId] = {
                'en-US': update.value,
              };
            }
          }
        });

        // Update the entry
        const updatedEntry = await cma.entry.update(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment || 'master',
            entryId,
          },
          {
            ...latestEntry,
            fields: updatedFields,
          }
        );

        return updatedEntry;
      });

      await Promise.all(updatePromises);

      // Store the backup for undo functionality
      setLastUpdateBackup(backups);

      // Show success notification with undo button (pass backup directly)
      showSuccessWithUndo(`Successfully updated ${selectedEntries.size} entries`, () =>
        undoUpdates(backups)
      );

      // Refresh entries
      if (selectedContentType) {
        await fetchEntries(selectedContentType);
      }
    } catch (error) {
      console.error('Error applying bulk updates:', error);
      showNotification('error', 'Failed to apply bulk updates');
    } finally {
      setLoading(false);
    }
  };

  // Undo updates with backup passed directly
  const undoUpdates = async (backupToUse: Record<string, Entry>) => {
    if (Object.keys(backupToUse).length === 0) {
      showNotification('warning', 'No recent updates to undo');
      return;
    }

    try {
      setLoading(true);

      const undoPromises = Object.entries(backupToUse).map(async ([entryId, backupEntry]) => {
        // Get the current entry to ensure we have the latest version
        const currentEntry = await cma.entry.get({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment || 'master',
          entryId,
        });

        // Restore the previous fields from backup
        const restoredEntry = await cma.entry.update(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment || 'master',
            entryId,
          },
          {
            ...currentEntry,
            fields: backupEntry.fields,
          }
        );

        return restoredEntry;
      });

      await Promise.all(undoPromises);

      showNotification(
        'success',
        `Successfully undid changes to ${Object.keys(backupToUse).length} entries`
      );

      // Clear the backup since we've used it
      setLastUpdateBackup({});

      // Refresh entries to show the reverted state
      if (selectedContentType) {
        await fetchEntries(selectedContentType);
      }
    } catch (error) {
      console.error('Error undoing updates:', error);
      showNotification('error', 'Failed to undo changes');
    } finally {
      setLoading(false);
    }
  };

  // Keep the old undo function for backwards compatibility (but it uses state)
  const undoLastUpdate = async () => {
    await undoUpdates(lastUpdateBackup);
  };

  // Render field value for display
  const renderFieldValue = (entry: Entry, fieldId: string) => {
    const value = entry.fields[fieldId];
    if (!value) return '-';

    const displayValue = value['en-US'] || value;
    if (typeof displayValue === 'object') {
      return JSON.stringify(displayValue);
    }
    return String(displayValue);
  };

  // Get field input component based on field type
  const getFieldInput = (field: any, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'Symbol':
      case 'Text':
        return (
          <TextInput
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.name}`}
          />
        );
      case 'Integer':
      case 'Number':
        return (
          <TextInput
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.name}`}
          />
        );
      case 'Boolean':
        return (
          <Checkbox isChecked={Boolean(value)} onChange={(e) => onChange(e.target.checked)}>
            {field.name}
          </Checkbox>
        );
      default:
        return (
          <TextInput
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.name}`}
          />
        );
    }
  };

  // In your undo function, you could restore to a previous version:
  const restoreEntryToVersion = async (entryId: string, targetVersion: number) => {
    console.log('versions', lastUpdateBackup);
    try {
      const entry = await cma.entry.get({
        spaceId: '6k5665momd5u',
        environmentId: 'ryun',
        entryId: '5NNNWj1pmDGKC4Qz2fxeHv',
      });

      console.log('awaiting entry', entry);
      // Get the snapshot at target version
      const snapshots = await cma.snapshot.getManyForEntry({
        entryId: '5NNNWj1pmDGKC4Qz2fxeHv',
        environmentId: 'ryun',
      });

      // const snapshots = await cma.entry.get({
      //   spaceId: sdk.ids.space,
      //   environmentId: sdk.ids.environment || 'master',
      //   entryId
      // });
      console.log('snapshots', snapshots);
    } catch (error) {
      console.error('Error restoring entry:', error);
      // showNotification('error', `Failed to restore entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Note: To get entries by specific version, you can use snapshots:
  // const snapshots = await cma.snapshot.getManyForEntry({ entryId: 'your-entry-id' });
  // const specificVersion = snapshots.items.find(s => s.sys.revision === versionNumber);
  // const entryData = specificVersion?.snapshot;

  return (
    <Box padding="spacingL" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Stack spacing="spacingXl" flexDirection="column">
        <Heading>Bulk Edit Contentful Entries</Heading>
        <Button onClick={() => restoreEntryToVersion('7sCkgqQWDtjaQFkxcK31Ig', 2)}>
          REVERT BISH
        </Button>
        {/* Content Type Selection */}
        <Card>
          <Box padding="spacingL">
            <Stack spacing="spacingM" flexDirection="column">
              <Heading as="h2">Select Content Model</Heading>
              <Select
                value={selectedContentType}
                onChange={handleContentTypeChange}
                isDisabled={loading}>
                <Select.Option value="" isDisabled>
                  Choose a content type...
                </Select.Option>
                {contentTypes.map((contentType) => (
                  <Select.Option key={contentType.sys.id} value={contentType.sys.id}>
                    {contentType.name}
                  </Select.Option>
                ))}
              </Select>
            </Stack>
          </Box>
        </Card>

        {/* Bulk Update Configuration */}
        {currentContentType && (
          <Card>
            <Box padding="spacingL">
              <Stack spacing="spacingL" flexDirection="column">
                <Box>
                  <Heading as="h2" marginBottom="spacingS">
                    Configure Bulk Updates
                  </Heading>
                  <Paragraph>Select fields to update and set their new values:</Paragraph>
                </Box>

                <Stack spacing="spacingM" flexDirection="column">
                  {currentContentType.fields.map((field) => (
                    <Card key={field.id}>
                      <Box padding="spacingM">
                        <Stack spacing="spacingM" flexDirection="column">
                          <Stack spacing="spacingS" flexDirection="column">
                            <Flex alignItems="center" gap="spacingS">
                              <Checkbox
                                isChecked={bulkUpdates[field.id]?.enabled || false}
                                onChange={() => toggleBulkUpdate(field.id)}
                              />
                              <Box>
                                <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
                                  <Heading as="h3" fontSize="fontSizeM">
                                    {field.name}
                                  </Heading>
                                  <Badge variant="secondary" size="small">
                                    {field.type}
                                  </Badge>
                                  {field.required && (
                                    <Badge variant="warning" size="small">
                                      Required
                                    </Badge>
                                  )}
                                </Flex>
                              </Box>
                            </Flex>
                          </Stack>

                          {bulkUpdates[field.id]?.enabled && (
                            <Box>
                              <Paragraph
                                fontSize="fontSizeS"
                                fontColor="gray600"
                                marginBottom="spacingXs">
                                New value for {field.name}:
                              </Paragraph>
                              {getFieldInput(field, bulkUpdates[field.id]?.value, (value) =>
                                updateBulkValue(field.id, value)
                              )}
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Card>
        )}

        {/* Apply Updates Button */}
        {currentContentType && selectedEntries.size > 0 && (
          <Card>
            <Box padding="spacingM">
              <Stack spacing="spacingS" flexDirection="column" alignItems="center">
                <Heading as="h3">
                  Ready to Update {selectedEntries.size}{' '}
                  {selectedEntries.size === 1 ? 'Entry' : 'Entries'}
                </Heading>
                <Button
                  variant="primary"
                  size="large"
                  onClick={applyBulkUpdates}
                  isDisabled={selectedEntries.size === 0 || loading}
                  isLoading={loading}>
                  Apply Updates to {selectedEntries.size}{' '}
                  {selectedEntries.size === 1 ? 'Entry' : 'Entries'}
                </Button>
              </Stack>
            </Box>
          </Card>
        )}

        {/* Entries Selection */}
        {entries.length > 0 && (
          <Card>
            <Box padding="spacingL">
              <Stack spacing="spacingL" flexDirection="column">
                <Stack spacing="spacingS" flexDirection="column">
                  <Heading as="h2">Select Entries to Update ({entries.length} total)</Heading>
                  {selectedEntries.size > 0 && (
                    <Badge variant="primary">{selectedEntries.size} selected</Badge>
                  )}
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={selectAllEntries}
                    style={{ alignSelf: 'flex-start' }}>
                    {selectedEntries.size === entries.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </Stack>

                {/* Entry List - Vertical Cards */}
                <Stack spacing="spacingS" flexDirection="column">
                  {entries.map((entry) => (
                    <Card key={entry.sys.id}>
                      <Box padding="spacingM">
                        <Stack spacing="spacingM" flexDirection="column">
                          <Flex alignItems="center" justifyContent="space-between">
                            <Flex alignItems="center" gap="spacingS">
                              <Checkbox
                                isChecked={selectedEntries.has(entry.sys.id)}
                                onChange={() => toggleEntrySelection(entry.sys.id)}
                              />
                              <Heading as="h4" fontSize="fontSizeM">
                                Entry
                              </Heading>
                            </Flex>
                            <Badge variant={entry.sys.publishedVersion ? 'positive' : 'warning'}>
                              {entry.sys.publishedVersion ? 'Published' : 'Draft'}
                            </Badge>
                          </Flex>

                          <Stack spacing="spacingS" flexDirection="column">
                            <Box>
                              <Paragraph fontSize="fontSizeS" fontColor="gray600">
                                Entry ID
                              </Paragraph>
                              <Paragraph fontSize="fontSizeS" style={{ fontFamily: 'monospace' }}>
                                {entry.sys.id}
                              </Paragraph>
                            </Box>

                            {currentContentType?.fields.slice(0, 3).map((field) => (
                              <Box key={field.id}>
                                <Paragraph fontSize="fontSizeS" fontColor="gray600">
                                  {field.name}
                                </Paragraph>
                                <Paragraph fontSize="fontSizeS">
                                  {renderFieldValue(entry, field.id)}
                                </Paragraph>
                              </Box>
                            ))}
                          </Stack>
                        </Stack>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Card>
        )}

        {loading && (
          <Flex justifyContent="center" alignItems="center" style={{ minHeight: '100px' }}>
            <Spinner />
          </Flex>
        )}
      </Stack>
    </Box>
  );
};

export default Page;
