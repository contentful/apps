/**
 * EntrySelector Component
 *
 * Modal for selecting entries to use in reference field conditions
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Box,
  Spinner,
  TextInput,
  FormControl,
  EntryCard,
  EntityStatus,
} from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { useCMA } from '@contentful/react-apps-toolkit';

interface EntrySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entryId: string, entryTitle: string) => void;
  onSelectMultiple?: (entries: Array<{ id: string; title: string }>) => void;
  spaceId: string;
  environmentId: string;
  contentTypeId?: string;
  allowMultiple?: boolean;
  initialSelectedIds?: string[];
}

export const EntrySelector: React.FC<EntrySelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  spaceId,
  environmentId,
  contentTypeId,
  allowMultiple = false,
  initialSelectedIds = [],
}) => {
  const cma = useCMA();
  const [entries, setEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [contentTypeMap, setContentTypeMap] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  // Helper function to get title from entry using displayField
  const getEntryTitle = (entry: any): string => {
    const contentType = contentTypeMap.get(entry.sys.contentType.sys.id);
    if (!contentType || !entry.fields) {
      return 'Untitled Entry';
    }

    const displayFieldId = contentType.displayField;
    if (displayFieldId && entry.fields[displayFieldId]) {
      const fieldValue = entry.fields[displayFieldId];
      // Get the first available locale value
      const localeValue = Object.values(fieldValue)[0];
      if (localeValue && typeof localeValue === 'string') {
        return localeValue;
      }
    }
    return 'Untitled Entry';
  };

  // Helper function to get entry status from metadata
  const getEntryStatus = (entry: any): EntityStatus => {
    if (entry.sys.archivedVersion) {
      return 'archived';
    }

    if (entry.sys.publishedVersion) {
      if (entry.sys.version > entry.sys.publishedVersion + 1) {
        return 'changed';
      }
      return 'published';
    }

    return 'draft';
  };

  // Initialize selected entry IDs when modal opens
  useEffect(() => {
    if (isOpen && allowMultiple && initialSelectedIds.length > 0) {
      setSelectedEntryIds(new Set(initialSelectedIds));
    } else if (isOpen && !allowMultiple) {
      // Clear selection for single select mode
      setSelectedEntryIds(new Set());
    }
  }, [isOpen, allowMultiple, initialSelectedIds]);

  // Load entries when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadEntries = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await cma.entry.getMany({
          spaceId,
          environmentId,
          query: {
            limit: 100,
            ...(contentTypeId && { content_type: contentTypeId }),
          },
        });

        // Fetch content types to get display field information
        const contentTypeIds = [
          ...new Set(response.items.map((entry: any) => entry.sys.contentType.sys.id)),
        ];
        const contentTypes = await Promise.all(
          contentTypeIds.map((id) =>
            cma.contentType.get({ spaceId, environmentId, contentTypeId: id })
          )
        );
        const ctMap = new Map(contentTypes.map((ct) => [ct.sys.id, ct]));
        setContentTypeMap(ctMap);

        const entryItems = response.items.filter((entry: any) => {
          // Filter out Conditionful Settings content type
          return entry.sys.contentType.sys.id !== 'conditionfulSettings';
        });

        setEntries(entryItems);
        setFilteredEntries(entryItems);
      } catch (err) {
        console.error('Error loading entries:', err);
        setError('Failed to load entries. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [isOpen, cma, spaceId, environmentId, contentTypeId]);

  // Filter entries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter((entry) => {
      const title = getEntryTitle(entry).toLowerCase();
      const id = entry.sys.id.toLowerCase();
      const contentType = entry.sys.contentType.sys.id.toLowerCase();
      return title.includes(query) || id.includes(query) || contentType.includes(query);
    });
    setFilteredEntries(filtered);
  }, [searchQuery, entries, contentTypeMap]);

  const handleSelect = (entry: any) => {
    if (allowMultiple) {
      // Toggle selection for multiple mode
      const newSelection = new Set(selectedEntryIds);
      if (newSelection.has(entry.sys.id)) {
        newSelection.delete(entry.sys.id);
      } else {
        newSelection.add(entry.sys.id);
      }
      setSelectedEntryIds(newSelection);
    } else {
      // Single selection mode - select and close
      onSelect(entry.sys.id, getEntryTitle(entry));
      setSearchQuery('');
      setSelectedEntryIds(new Set());
      onClose();
    }
  };

  const handleSaveMultiple = () => {
    if (onSelectMultiple && allowMultiple) {
      const allSelectedEntries = entries
        .filter((entry) => selectedEntryIds.has(entry.sys.id))
        .map((entry) => ({ id: entry.sys.id, title: getEntryTitle(entry) }));

      onSelectMultiple(allSelectedEntries);
      setSearchQuery('');
      setSelectedEntryIds(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedEntryIds(new Set());
    onClose();
  };

  return (
    <Modal onClose={handleClose} isShown={isOpen} size="large">
      {() => (
        <>
          <Modal.Header
            title={allowMultiple ? 'Select Entries' : 'Select Entry'}
            onClose={handleClose}
          />
          <Modal.Content>
            <FormControl>
              <FormControl.Label>Search entries</FormControl.Label>
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, ID, or content type..."
                icon={<SearchIcon />}
              />
            </FormControl>

            {isLoading ? (
              <Box padding="spacingL">
                <Spinner size="large" />
              </Box>
            ) : error ? (
              <Text fontColor="red500">{error}</Text>
            ) : filteredEntries.length === 0 ? (
              <Text fontColor="gray500">
                {searchQuery ? 'No entries match your search.' : 'No entries found.'}
              </Text>
            ) : (
              <Stack flexDirection="column" spacing="spacingS">
                {filteredEntries.map((entry) => {
                  const isSelected = selectedEntryIds.has(entry.sys.id);
                  console.log(entry);
                  return (
                    <EntryCard
                      key={entry.sys.id}
                      title={getEntryTitle(entry)}
                      size="small"
                      status={getEntryStatus(entry)}
                      contentType={entry.sys.contentType.sys.id}
                      isSelected={allowMultiple ? isSelected : undefined}
                      onClick={() => handleSelect(entry)}
                    />
                  );
                })}
              </Stack>
            )}
          </Modal.Content>
          <Modal.Controls>
            <>
              <Button variant="transparent" onClick={handleClose}>
                Cancel
              </Button>
              {allowMultiple && (
                <Button
                  variant="positive"
                  onClick={handleSaveMultiple}
                  isDisabled={selectedEntryIds.size === 0}>
                  Save Selection ({selectedEntryIds.size})
                </Button>
              )}
            </>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
