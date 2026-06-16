import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Radio,
  Select,
  Text,
} from '@contentful/f36-components';
import type { WorkflowContentType, AddEntryWizardParams, EditModalNewLocation } from '@types';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

type WizardStep = 'content-type' | 'is-reference' | 'select-reference' | 'select-fields';

interface ExistingEntry {
  tempId: string;
  label: string;
}

interface AddEntryWizardProps {
  contentTypes: WorkflowContentType[];
  existingEntries: ExistingEntry[];
  selectedText: string;
  isImageContent: boolean;
  onAdd: (params: AddEntryWizardParams) => void;
  onCancel: () => void;
  buildNewLocation: (contentTypeId: string) => EditModalNewLocation;
}

export const AddEntryWizard = ({
  contentTypes,
  existingEntries,
  selectedText,
  isImageContent,
  onAdd,
  onCancel,
  buildNewLocation,
}: AddEntryWizardProps) => {
  const [step, setStep] = useState<WizardStep>('content-type');
  const [contentTypeId, setContentTypeId] = useState('');
  const [isReference, setIsReference] = useState<boolean | null>(null);
  const [referenceEntryId, setReferenceEntryId] = useState('');
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

  const newLocation = contentTypeId ? buildNewLocation(contentTypeId) : null;

  const handleNext = () => {
    if (step === 'content-type') {
      setStep('is-reference');
    } else if (step === 'is-reference') {
      if (isReference) {
        setStep('select-reference');
      } else {
        setStep('select-fields');
      }
    } else if (step === 'select-reference') {
      setStep('select-fields');
    }
  };

  const handleBack = () => {
    if (step === 'is-reference') {
      setStep('content-type');
    } else if (step === 'select-reference') {
      setStep('is-reference');
    } else if (step === 'select-fields') {
      if (isReference) {
        setStep('select-reference');
      } else {
        setStep('is-reference');
      }
    }
  };

  const handleSave = () => {
    onAdd({
      contentTypeId,
      isReference: isReference ?? false,
      referenceEntryId: isReference ? referenceEntryId || null : null,
      fieldIds: selectedFieldIds,
    });
  };

  const isNextDisabled = () => {
    if (step === 'content-type') return !contentTypeId;
    if (step === 'is-reference') return isReference === null;
    if (step === 'select-reference') return !referenceEntryId;
    return false;
  };

  const isSaveDisabled = selectedFieldIds.length === 0;

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Text as="p" fontWeight="fontWeightDemiBold">
        Add entry
      </Text>

      {step === 'content-type' && (
        <FormControl marginBottom="none">
          <FormControl.Label>Select content type</FormControl.Label>
          <Select
            value={contentTypeId}
            onChange={(e) => setContentTypeId(e.target.value)}>
            <Select.Option value="" isDisabled>
              Select a content type
            </Select.Option>
            {contentTypes.map((ct) => (
              <Select.Option key={ct.sys.id} value={ct.sys.id}>
                {ct.name ?? ct.sys.id}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      )}

      {step === 'is-reference' && (
        <FormControl marginBottom="none">
          <FormControl.Label>Should this entry be a reference entry?</FormControl.Label>
          <Flex flexDirection="column" gap="spacingXs">
            <Radio
              id="ref-yes"
              name="is-reference"
              value="yes"
              isChecked={isReference === true}
              onChange={() => setIsReference(true)}>
              Yes
            </Radio>
            <Radio
              id="ref-no"
              name="is-reference"
              value="no"
              isChecked={isReference === false}
              onChange={() => setIsReference(false)}>
              No
            </Radio>
          </Flex>
        </FormControl>
      )}

      {step === 'select-reference' && (
        <FormControl marginBottom="none">
          <FormControl.Label>Select entry it should be a reference to</FormControl.Label>
          <Select
            value={referenceEntryId}
            onChange={(e) => setReferenceEntryId(e.target.value)}>
            <Select.Option value="" isDisabled>
              Select an entry
            </Select.Option>
            {existingEntries.map((entry) => (
              <Select.Option key={entry.tempId} value={entry.tempId}>
                {entry.label}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      )}

      {step === 'select-fields' && newLocation && (
        <FormControl marginBottom="none">
          <FormControl.Label>Select the field(s) the content should map to</FormControl.Label>
          <FieldSelectionDropdown
            selectedText={selectedText}
            isImageContent={isImageContent}
            fieldOptions={newLocation.fieldOptions}
            fieldMappings={newLocation.fieldMappings}
            selectedFieldIds={selectedFieldIds}
            onSelectedFieldIdsChange={(updater) =>
              setSelectedFieldIds((prev) => updater(prev))
            }
          />
        </FormControl>
      )}

      <Box>
        <Flex justifyContent="flex-end" gap="spacingXs">
          <Button size="small" variant="secondary" onClick={step === 'content-type' ? onCancel : handleBack}>
            {step === 'content-type' ? 'Cancel' : 'Back'}
          </Button>
          {step === 'select-fields' ? (
            <Button size="small" variant="primary" isDisabled={isSaveDisabled} onClick={handleSave}>
              Save
            </Button>
          ) : (
            <Button size="small" variant="primary" isDisabled={isNextDisabled()} onClick={handleNext}>
              Next
            </Button>
          )}
        </Flex>
      </Box>
    </Flex>
  );
};
