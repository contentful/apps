import React, { useEffect, useState } from 'react';
import { Button, Flex, FormControl, Modal, Note, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps } from 'contentful-management';
import type { ContentTypeField, Entry } from '../types';
import {
  getEntryFieldValue,
  getEntryLinkIds,
  getEntryTitle,
  getFieldDisplayValue,
  getReferenceDisplayValue,
} from '../utils/entryUtils';
import { API_LIMITS } from '../utils/constants';
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
  contentTypes: ContentTypeProps[];
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
  contentTypes,
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
      try {
        const linkedEntries: Entry[] = [];
        const contentTypeMap = new Map(contentTypes.map((ct) => [ct.sys.id, ct]));

        for (let i = 0; i < referenceIds.length; i += API_LIMITS.CORS_QUERY_PARAM_LIMIT) {
          const chunk = referenceIds.slice(i, i + API_LIMITS.CORS_QUERY_PARAM_LIMIT);
          const response = await sdk.cma.entry.getMany({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            query: { 'sys.id[in]': chunk.join(','), limit: chunk.length },
          });
          linkedEntries.push(...((response.items as Entry[]) || []));
        }

        if (!isMounted) {
          return;
        }

        const labels = Object.fromEntries(
          linkedEntries.map((entry) => {
            const ct = contentTypeMap.get(entry.sys.contentType.sys.id);
            const label = ct ? getEntryTitle(entry, ct, locales.default) : entry.sys.id;
            return [entry.sys.id, label];
          })
        );

        setReferenceDisplayValues(labels);
      } catch {
        if (isMounted) {
          setReferenceDisplayValues({});
        }
      }
    };

    void loadReferenceTitles();

    return () => {
      isMounted = false;
    };
  }, [firstValueToUpdate, isOpen, sdk, selectedField, contentTypes, locales.default]);

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
                contentTypes={contentTypes}
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
