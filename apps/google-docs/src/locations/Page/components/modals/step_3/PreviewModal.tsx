import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Modal,
  Paragraph,
  Table,
  Text,
  Badge,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { EntryToCreate } from '../../../../../../functions/agents/documentParserAgent/schema';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: EntryToCreate[] | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  entries,
  onConfirm,
  isSubmitting,
}) => {
  const entriesByContentType = useMemo(() => {
    if (!entries) return {};

    return entries.reduce((acc, entry) => {
      if (!acc[entry.contentTypeId]) {
        acc[entry.contentTypeId] = [];
      }
      acc[entry.contentTypeId].push(entry);
      return acc;
    }, {} as Record<string, EntryToCreate[]>);
  }, [entries]);

  const totalEntries = useMemo(() => entries?.length || 0, [entries]);

  const renderFieldValue = (value: any, maxLength: number = 100): string => {
    if (value === null || value === undefined) {
      return '—';
    }

    if (typeof value === 'object') {
      const stringified = JSON.stringify(value, null, 2);
      return stringified.length > maxLength
        ? stringified.substring(0, maxLength) + '...'
        : stringified;
    }

    const stringValue = String(value);
    return stringValue.length > maxLength
      ? stringValue.substring(0, maxLength) + '...'
      : stringValue;
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirm = () => {
    if (isSubmitting) return;
    onConfirm();
  };

  if (!entries || entries.length === 0) {
    return null;
  }

  return (
    <Modal onClose={handleClose} isShown={isOpen} size="fullWidth">
      {() => (
        <>
          <Modal.Header title="Preview Parsed Entries" onClose={handleClose} />
          <Modal.Content>
            <Flex flexDirection="column" gap="spacingM">
              <Card>
                <Flex flexDirection="column" gap="spacingS">
                  <Paragraph>
                    Based off the document, the following entries are being suggested:
                  </Paragraph>
                </Flex>
              </Card>

              {/* Entries by Content Type */}
              {Object.entries(entriesByContentType).map(([contentTypeId, entries], ctIndex) => (
                <Card key={contentTypeId}>
                  <Flex flexDirection="column" gap="spacingM">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading as="h3" marginBottom="spacingXs">
                        {contentTypeId}
                      </Heading>
                      <Badge variant="positive">{entries.length} entries</Badge>
                    </Flex>

                    {entries.map((entry, entryIndex) => (
                      <Box
                        key={`${contentTypeId}-${entryIndex}`}
                        padding="spacingS"
                        style={{
                          backgroundColor: tokens.gray100,
                          borderRadius: tokens.borderRadiusMedium,
                        }}>
                        <Flex flexDirection="column" gap="spacingXs">
                          <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
                            Entry {entryIndex + 1}
                          </Text>

                          <Box style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <Table>
                              <Table.Head>
                                <Table.Row>
                                  <Table.Cell style={{ width: '30%' }}>Field</Table.Cell>
                                  <Table.Cell style={{ width: '15%' }}>Locale</Table.Cell>
                                  <Table.Cell style={{ width: '55%' }}>Value</Table.Cell>
                                </Table.Row>
                              </Table.Head>
                              <Table.Body>
                                {Object.entries(entry.fields).map(([fieldId, localizedValue]) => {
                                  // localizedValue is a record like { 'en-US': actualValue }
                                  return Object.entries(localizedValue).map(([locale, value]) => (
                                    <Table.Row key={`${fieldId}-${locale}`}>
                                      <Table.Cell>
                                        <Text fontWeight="fontWeightMedium">{fieldId}</Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Text fontColor="gray600" fontSize="fontSizeS">
                                          {locale}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Text
                                          fontSize="fontSizeS"
                                          style={{
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: 'monospace',
                                          }}>
                                          {renderFieldValue(value)}
                                        </Text>
                                      </Table.Cell>
                                    </Table.Row>
                                  ));
                                })}
                              </Table.Body>
                            </Table>
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={handleClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="positive"
              onClick={handleConfirm}
              isDisabled={isSubmitting || totalEntries === 0}
              isLoading={isSubmitting}>
              {isSubmitting ? 'Creating Entries...' : 'Create Entries'}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
