/**
 * EntrySelector Component
 *
 * Modal for selecting entries to use in reference field conditions
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Box,
  Spinner,
  TextInput,
  FormControl,
} from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { useCMA } from '@contentful/react-apps-toolkit';

interface EntrySelectorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when entry is selected */
  onSelect: (entryId: string, entryTitle: string) => void;
  /** Current space ID */
  spaceId: string;
  /** Current environment ID */
  environmentId: string;
  /** Optional content type ID to filter entries */
  contentTypeId?: string;
}

interface EntryItem {
  id: string;
  title: string;
  contentType: string;
  updatedAt: string;
}

export const EntrySelector: React.FC<EntrySelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  spaceId,
  environmentId,
  contentTypeId,
}) => {
  const cma = useCMA();
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

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

        const entryItems: EntryItem[] = response.items.map((entry: any) => {
          // Try to get a meaningful title from the entry
          let title = 'Untitled Entry';
          if (entry.fields) {
            // Common title fields to check
            const titleFields = ['title', 'name', 'label', 'heading'];
            for (const fieldName of titleFields) {
              if (entry.fields[fieldName]) {
                const fieldValue = entry.fields[fieldName];
                // Get the first available locale value
                const localeValue = Object.values(fieldValue)[0];
                if (localeValue && typeof localeValue === 'string') {
                  title = localeValue;
                  break;
                }
              }
            }
          }

          return {
            id: entry.sys.id,
            title,
            contentType: entry.sys.contentType.sys.id,
            updatedAt: entry.sys.updatedAt,
          };
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
    const filtered = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query) ||
        entry.contentType.toLowerCase().includes(query)
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const handleSelect = (entry: EntryItem) => {
    onSelect(entry.id, entry.title);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal onClose={handleClose} isShown={isOpen} size="large">
      {() => (
        <>
          <Modal.Header title="Select Entry" onClose={handleClose} />
          <Modal.Content>
            <Stack flexDirection="column" spacing="spacingM">
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
                <Box
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #d3dce0',
                    borderRadius: '6px',
                  }}>
                  <Stack flexDirection="column" spacing="none">
                    {filteredEntries.map((entry) => (
                      <Box
                        key={entry.id}
                        padding="spacingS"
                        style={{
                          borderBottom: '1px solid #e5ebed',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f7f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={() => handleSelect(entry)}>
                        <Stack flexDirection="column" spacing="spacing2Xs">
                          <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
                            {entry.title}
                          </Text>
                          <Text fontSize="fontSizeS" fontColor="gray600">
                            ID: {entry.id} • Type: {entry.contentType}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Modal.Content>
          <Modal.Controls>
            <Button variant="transparent" onClick={handleClose}>
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
