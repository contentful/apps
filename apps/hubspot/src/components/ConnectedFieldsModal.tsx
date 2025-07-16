import { ContentTypeProps, EntryProps, KeyValueMap } from 'contentful-management';
import { useState } from 'react';
import { displayType, EntryConnectedFields, getEntryTitle } from '../utils/utils';
import { Box, Button, Checkbox, Flex, Modal, Stack, Table, Text } from '@contentful/f36-components';
import { styles } from './ConnectedFieldsModal.styles';

function localizeFieldId(fieldId: string, locale?: string) {
  return locale ? `${fieldId}.${locale}` : fieldId;
}

function ConnectedFieldsModal({
  entry,
  isShown,
  onClose,
  onViewEntry,
  entryConnectedFields,
  defaultLocale,
}: {
  entry: { entry: EntryProps<KeyValueMap>; contentType: ContentTypeProps };
  isShown: boolean;
  onClose: () => void;
  onViewEntry: () => void;
  entryConnectedFields: EntryConnectedFields;
  defaultLocale: string;
}) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set());
  const allFieldIds = entryConnectedFields.map((field) =>
    localizeFieldId(field.fieldId, field.locale)
  );
  const allSelected = allFieldIds.every((id) => selectedFields.has(id));
  const someSelected = allFieldIds.some((id) => selectedFields.has(id));

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
    // todo : implement
  };

  const getFieldDisplayName = (fieldId: string, locale?: string) => {
    const field = entry.contentType.fields.find((f) => f.id === fieldId);
    if (!field) return fieldId;
    const type = displayType(field.type, field.linkType, field.items);
    return locale ? `${field.name} (${locale}) (${type})` : field.name;
  };

  return (
    <Modal isShown={isShown} onClose={onClose} size="medium" testId="connected-fields-modal">
      <Modal.Header title="Connected fields" onClose={onClose} />
      <Modal.Content>
        <Box className={styles.modalMainContainer}>
          <Box className={styles.modalEntryContainer}>
            <Flex flexDirection="column">
              <Text fontColor="gray600" marginBottom="spacing2Xs">
                Entry name
              </Text>
              <Text testId="modal-entry-title" fontWeight="fontWeightDemiBold">
                {getEntryTitle(entry.entry, entry.contentType, defaultLocale)}
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
                    testId="select-all-fields"
                    aria-label="Select all fields"
                  />
                </Table.Cell>
                <Table.Cell className={styles.baseCell}>
                  <Text fontColor="gray600">Select all fields ({entryConnectedFields.length})</Text>
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
    </Modal>
  );
}

export default ConnectedFieldsModal;
