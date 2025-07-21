import React, { useState } from 'react';
import {
  displayType,
  EntryConnectedFields,
  EntryWithContentType,
  getEntryTitle,
} from '../utils/utils';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Modal,
  Note,
  Stack,
  Table,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { styles } from './ConnectedFieldsModal.styles';
import WarningOctagonIcon from './WarningOctagonIcon';
import { PageAppSDK } from '@contentful/app-sdk';

type ConnectedFieldsModalProps = {
  entryWithContentType: EntryWithContentType;
  isShown: boolean;
  onClose: () => void;
  onViewEntry: () => void;
  entryConnectedFields: EntryConnectedFields;
  defaultLocale: string;
  sdk: PageAppSDK;
};

const ConnectedFieldsModal: React.FC<ConnectedFieldsModalProps> = ({
  entryWithContentType,
  isShown,
  onClose,
  onViewEntry,
  entryConnectedFields,
  defaultLocale,
  sdk,
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set());

  const allFieldIds = entryConnectedFields.map((field) =>
    getUniqueFieldId(field.fieldId, field.locale)
  );
  const allSelected = allFieldIds.length > 0 && allFieldIds.every((id) => selectedFields.has(id));
  const someSelected = allFieldIds.some((id) => selectedFields.has(id));
  const fieldsWithErrors = entryConnectedFields.filter((field) => field.error);

  function handleSelectAll() {
    if (allSelected) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(allFieldIds));
    }
  }

  function handleFieldToggle(id: string) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDisconnect() {
    // TODO: Implement disconnect logic
  }

  function getFieldDisplayName(fieldId: string, locale?: string) {
    return locale ? `${fieldId} (${locale})` : `${fieldId}`;
  }

  function getFieldDisplayType(fieldId: string) {
    const field = entryWithContentType.contentType.fields.find((f) => f.id === fieldId);
    if (!field) return '';
    return displayType(field.type, field.linkType, field.items);
  }

  function getUniqueFieldId(fieldId: string, locale?: string) {
    return locale ? `${fieldId}.${locale}` : fieldId;
  }

  return (
    <Modal isShown={isShown} onClose={onClose} size="medium" testId="connected-fields-modal">
      <Modal.Header
        title="Manage synced entry fields"
        onClose={onClose}
        className={styles.modalHeaderFrame}
      />
      <Modal.Content className={styles.modalContentFrame}>
        <Box className={styles.modalMainContainer}>
          <Box paddingBottom="spacingS">
            <Text>Selected fields are dynamically synced to Hubspot email modules.</Text>
          </Box>
          <Box className={styles.modalEntryContainer}>
            <Flex flexDirection="column">
              <Text fontColor="gray600" marginBottom="spacing2Xs">
                Entry name
              </Text>
              <Text testId="modal-entry-title" fontWeight="fontWeightDemiBold">
                {getEntryTitle(
                  entryWithContentType.entry,
                  entryWithContentType.contentType,
                  defaultLocale
                )}
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
          {fieldsWithErrors.length > 0 && (
            <Note
              variant="negative"
              icon={<WarningOctagonIcon />}
              className={styles.modalErrorBanner}>
              <Text lineHeight="lineHeightCondensed" fontColor="gray800">
                Unable to sync content. Review your connected fields or{' '}
                <TextLink onClick={() => sdk.navigator.openAppConfig()}>app configuration</TextLink>
                .
              </Text>
            </Note>
          )}
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
                const uniqueFieldId = getUniqueFieldId(field.fieldId, field.locale);
                return (
                  <Table.Row key={`${uniqueFieldId}-${index}`}>
                    <Table.Cell className={styles.checkboxCell}>
                      <Checkbox
                        isChecked={selectedFields.has(uniqueFieldId)}
                        onChange={() => handleFieldToggle(uniqueFieldId)}
                        aria-label={getFieldDisplayName(field.fieldId, field.locale)}
                      />
                    </Table.Cell>
                    <Table.Cell className={styles.baseCell}>
                      <Flex flexDirection="row" gap="spacing2Xs">
                        <Text fontWeight="fontWeightDemiBold">
                          {getFieldDisplayName(field.fieldId, field.locale)}
                        </Text>
                        <Text fontColor="gray500">({getFieldDisplayType(field.fieldId)})</Text>
                        {field.error && (
                          <Badge
                            className={styles.badgeStyle}
                            variant="negative"
                            startIcon={<WarningOctagonIcon />}>{`Connection error`}</Badge>
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
    </Modal>
  );
};

export default ConnectedFieldsModal;
