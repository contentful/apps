/**
 * Entry Selection Dialog Location
 *
 * Full-screen dialog for selecting entries with filtering support.
 * Used when SET_OPTIONS rules restrict available entries for a reference field.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import {
  Stack,
  Text,
  Spinner,
  Note,
  TextInput,
  Flex,
  Card,
  Badge,
  Checkbox,
  Box,
  Button,
} from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';

interface Entry {
  sys: {
    id: string;
    type: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
  fields: Record<string, any>;
}

interface InvocationParameters {
  allowedEntryIds: string[];
  multiple: boolean;
  currentlySelected: string[];
  defaultLocale: string;
}

const EntrySelectionDialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const cma = useCMA();

  const params = sdk.parameters.invocation as InvocationParameters;
  const { allowedEntryIds, multiple, currentlySelected, defaultLocale } = params;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentlySelected));

  // Fetch entries on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch entries by IDs
      const response = await cma.entry.getMany({
        query: {
          'sys.id[in]': allowedEntryIds.join(','),
          limit: 1000,
        },
      });

      setEntries(response.items as Entry[]);
    } catch (err) {
      console.error('[EntrySelectionDialog] Error fetching entries:', err);
      setError('Failed to load entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get entry title from fields
  const getEntryTitle = (entry: Entry): string => {
    const fields = entry.fields;

    // Try common title field names
    const titleFieldNames = ['title', 'name', 'displayName', 'label', 'heading'];

    for (const fieldName of titleFieldNames) {
      if (fields[fieldName]) {
        const value = fields[fieldName][defaultLocale];
        if (value && typeof value === 'string') {
          return value;
        }
      }
    }

    // Fallback to entry ID
    return `Entry ${entry.sys.id}`;
  };

  // Get entry content type name
  const getContentTypeName = (entry: Entry): string => {
    return entry.sys.contentType.sys.id;
  };

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }

    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      const title = getEntryTitle(entry).toLowerCase();
      const contentType = getContentTypeName(entry).toLowerCase();
      const entryId = entry.sys.id.toLowerCase();

      return title.includes(query) || contentType.includes(query) || entryId.includes(query);
    });
  }, [entries, searchQuery, defaultLocale]);

  // Handle entry selection
  const handleToggleEntry = (entryId: string) => {
    const newSelection = new Set(selectedIds);

    if (multiple) {
      // Multiple selection
      if (newSelection.has(entryId)) {
        newSelection.delete(entryId);
      } else {
        newSelection.add(entryId);
      }
    } else {
      // Single selection
      newSelection.clear();
      newSelection.add(entryId);
    }

    setSelectedIds(newSelection);
  };

  // Handle save
  const handleSave = () => {
    const selectedEntries = entries.filter((entry) => selectedIds.has(entry.sys.id));
    sdk.close(selectedEntries);
  };

  // Handle cancel
  const handleCancel = () => {
    sdk.close(null);
  };

  return (
    <Box padding="spacingL" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Stack flexDirection="column" spacing="spacingM" style={{ flex: 1, overflow: 'hidden' }}>
        <Stack flexDirection="column" spacing="spacingS">
          <Text fontSize="fontSize2Xl" fontWeight="fontWeightDemiBold">
            {multiple ? 'Select Entries' : 'Select Entry'}
          </Text>
          <Text fontSize="fontSizeM" fontColor="gray700">
            {multiple
              ? 'Select one or more entries from the allowed list:'
              : 'Select an entry from the allowed list:'}
          </Text>
        </Stack>

        {/* Search Input */}
        <TextInput
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<SearchIcon />}
        />

        {/* Loading State */}
        {isLoading && (
          <Flex justifyContent="center" padding="spacingL">
            <Spinner />
          </Flex>
        )}

        {/* Error State */}
        {error && <Note variant="negative">{error}</Note>}

        {/* Empty State */}
        {!isLoading && !error && entries.length === 0 && (
          <Note variant="warning">No entries available.</Note>
        )}

        {/* No Search Results */}
        {!isLoading && !error && entries.length > 0 && filteredEntries.length === 0 && (
          <Note variant="neutral">No entries match your search.</Note>
        )}

        {/* Entries List */}
        {!isLoading && !error && filteredEntries.length > 0 && (
          <Stack flexDirection="column" spacing="spacingXs" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredEntries.map((entry) => {
              const isSelected = selectedIds.has(entry.sys.id);
              const title = getEntryTitle(entry);
              const contentType = getContentTypeName(entry);
              const isPublished = !!entry.sys.publishedAt;

              return (
                <Card
                  key={entry.sys.id}
                  padding="spacingM"
                  style={{
                    cursor: 'pointer',
                    border: isSelected
                      ? '2px solid var(--f36-color-blue-600)'
                      : '1px solid var(--f36-color-gray-300)',
                    backgroundColor: isSelected ? 'var(--f36-color-blue-100)' : 'transparent',
                  }}
                  onClick={() => handleToggleEntry(entry.sys.id)}>
                  <Flex justifyContent="space-between" alignItems="flex-start">
                    <Flex alignItems="flex-start" gap="spacingS" style={{ flex: 1 }}>
                      {multiple && (
                        <Checkbox
                          isChecked={isSelected}
                          onChange={() => handleToggleEntry(entry.sys.id)}
                          style={{ marginTop: '2px' }}
                        />
                      )}
                      <Stack flexDirection="column" spacing="spacingXs" style={{ flex: 1 }}>
                        <Text fontWeight="fontWeightMedium" fontSize="fontSizeL">
                          {title}
                        </Text>
                        <Flex gap="spacingXs" alignItems="center" flexWrap="wrap">
                          <Badge variant="secondary" size="small">
                            {contentType}
                          </Badge>
                          <Badge variant={isPublished ? 'positive' : 'warning'} size="small">
                            {isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <Text fontSize="fontSizeS" fontColor="gray500">
                            {entry.sys.id}
                          </Text>
                        </Flex>
                      </Stack>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* Selection Summary and Actions */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          padding="spacingM"
          style={{
            borderTop: '1px solid var(--f36-color-gray-300)',
            marginTop: 'auto',
          }}>
          <Text fontSize="fontSizeM" fontColor="gray600">
            {selectedIds.size > 0
              ? `${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'} selected`
              : 'No entries selected'}
          </Text>
          <Flex gap="spacingS">
            <Button variant="transparent" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="positive"
              onClick={handleSave}
              isDisabled={isLoading || selectedIds.size === 0}>
              {multiple
                ? `Select ${selectedIds.size} ${selectedIds.size === 1 ? 'Entry' : 'Entries'}`
                : 'Select Entry'}
            </Button>
          </Flex>
        </Flex>
      </Stack>
    </Box>
  );
};

export default EntrySelectionDialog;
