import React, { useEffect, useState } from 'react';
import { Button, Flex, FormControl, Modal, Note, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { ContentTypeField, Entry } from '../types';
import {
  getEntryFieldValue,
  getEntryLinkIds,
  getFieldDisplayValue,
  getReferenceDisplayValue,
} from '../utils/entryUtils';
import { ClockIcon } from '@contentful/f36-icons';
import { FieldEditor } from './FieldEditor';
import { FieldValidation } from './FieldValidation';
import type { LocalesAPI } from '@contentful/field-editor-shared';
import type { FieldValue } from './FieldEditor';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: FieldValue) => void;
  selectedEntries: Entry[];
  selectedField: ContentTypeField | null;
  locales: LocalesAPI;
  isSaving: boolean;
  totalUpdateCount: number;
  editionCount: number;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedEntries,
  selectedField,
  locales,
  isSaving,
  totalUpdateCount,
  editionCount,
}) => {
  const sdk = useSDK<PageAppSDK>();
  const [value, setValue] = useState<FieldValue>('');
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [referenceDisplayValues, setReferenceDisplayValues] = useState<Record<string, string>>({});
  const entryCount = selectedEntries.length;
  const firstEntry = selectedEntries[0];
  const firstValueToUpdate =
    firstEntry && selectedField && locales.default
      ? getEntryFieldValue(firstEntry, selectedField, locales.default)
      : '';
  const title = entryCount === 1 ? 'Edit' : 'Bulk edit';

  useEffect(() => {
    setValue('');
    setHasValidationErrors(false);
  }, [isOpen]);

  useEffect(() => {
    const referenceIds = getEntryLinkIds(firstValueToUpdate);

    if (!selectedField || referenceIds.length === 0 || !isOpen) {
      setReferenceDisplayValues({});
      return;
    }

    let isMounted = true;

    const loadReferenceTitles = async () => {
      const entries = await Promise.all(
        referenceIds.map(async (entryId) => {
          try {
            const entry = await sdk.cma.entry.get({
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
              entryId,
            });

            return entry || null;
          } catch {
            return null;
          }
        })
      );

      if (!isMounted) {
        return;
      }

      const labels = entries.reduce<Record<string, string>>((acc, entry, index) => {
        if (entry) {
          const firstField = Object.values((entry as Entry).fields || {}).find(
            (localizedFieldValue) =>
              localizedFieldValue &&
              typeof localizedFieldValue === 'object' &&
              Object.keys(localizedFieldValue).length > 0
          ) as Record<string, unknown> | undefined;

          const firstLocalizedValue = firstField ? Object.values(firstField)[0] : undefined;
          acc[referenceIds[index]] =
            typeof firstLocalizedValue === 'string' && firstLocalizedValue.trim() !== ''
              ? firstLocalizedValue
              : referenceIds[index];
        }

        return acc;
      }, {});

      setReferenceDisplayValues(labels);
    };

    void loadReferenceTitles();

    return () => {
      isMounted = false;
    };
  }, [firstValueToUpdate, isOpen, sdk, selectedField]);

  const firstValueDisplay = getReferenceDisplayValue(firstValueToUpdate, referenceDisplayValues)
    ? getFieldDisplayValue(selectedField, firstValueToUpdate, 30, referenceDisplayValues)
    : getFieldDisplayValue(selectedField, firstValueToUpdate, 30);

  return (
    <Modal
      isShown={isOpen}
      onClose={onClose}
      size="medium"
      aria-label={title}
      key={`bulk-edit-modal-${isOpen ? 'open' : 'closed'}`}>
      <Modal.Header title={title} />
      <Modal.Content>
        <Flex gap="spacingS" flexDirection="column">
          <Text>
            Editing field: <Text fontWeight="fontWeightDemiBold">{selectedField?.name}</Text>
          </Text>
          <Flex>
            <Text>
              <Text fontWeight="fontWeightDemiBold">{firstValueDisplay}</Text>{' '}
              {entryCount === 1 ? 'selected' : `selected and ${entryCount - 1} more`}
            </Text>
          </Flex>
          {selectedField && (
            <>
              <FieldEditor
                field={selectedField}
                value={value}
                onChange={setValue}
                locales={locales}
                datatest-id="field-editor"
              />
              <FieldValidation
                field={selectedField}
                value={value}
                onValidationChange={setHasValidationErrors}
              />
            </>
          )}
        </Flex>
        {totalUpdateCount > 0 && isSaving && (
          <Note title="Updating entries" variant="neutral" icon={<ClockIcon variant="muted" />}>
            {`${editionCount} of ${totalUpdateCount} completed`}
          </Note>
        )}
      </Modal.Content>
      <Modal.Controls>
        <Button
          variant="secondary"
          onClick={onClose}
          testId="bulk-edit-cancel"
          isDisabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(value)}
          isDisabled={hasValidationErrors || isSaving}
          testId="bulk-edit-save"
          isLoading={isSaving}>
          Save
        </Button>
      </Modal.Controls>
    </Modal>
  );
};
