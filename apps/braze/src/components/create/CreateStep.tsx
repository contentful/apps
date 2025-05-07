import {
  Box,
  Paragraph,
  Button,
  Card,
  Text,
  Stack,
  IconButton,
  Flex,
  TextInput,
} from '@contentful/f36-components';
import { EditIcon } from '@contentful/f36-icons';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';
import { useState, useEffect } from 'react';

type CreateStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  contentBlockName: string;
  setContentBlockName: (name: string) => void;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: (contentBlockNames: Record<string, string>) => void;
};

const getDefaultContentBlockName = (entry: Entry, fieldId: string) => {
  const entryTitle = entry.title || 'Untitled';
  return `${entryTitle.replace(/\s+/g, '-')}-${fieldId}`;
};

const CreateStep = ({
  entry,
  selectedFields,
  isSubmitting,
  handlePreviousStep,
  handleNextStep,
}: CreateStepProps) => {
  const [contentBlockNames, setContentBlockNames] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    // Initialize content block names with defaults
    const initialNames: Record<string, string> = {};
    Array.from(selectedFields).forEach((fieldId) => {
      initialNames[fieldId] = getDefaultContentBlockName(entry, fieldId);
    });
    setContentBlockNames(initialNames);
  }, [entry, selectedFields]);

  const handleEdit = (fieldId: string) => {
    setEditingField(fieldId);
  };

  const handleNameChange = (fieldId: string, value: string) => {
    setContentBlockNames((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = (fieldId: string) => {
    setEditingField(null);
  };

  return (
    <>
      <Box>
        <Paragraph>
          Edit each field to change the name or add an optional description. When complete, send
          directly to Braze. Content Block names should be unique.
        </Paragraph>
        <Stack spacing="spacingS" flexDirection="column">
          {Array.from(selectedFields).map((fieldId: string) => (
            <Card key={fieldId} margin="none" style={{ padding: 'spacingXs' }}>
              <Flex justifyContent="space-between">
                <Stack spacing="spacing2Xs" flexDirection="column" alignItems="flex-start">
                  <Text>Name</Text>
                  {editingField === fieldId ? (
                    <TextInput
                      value={contentBlockNames[fieldId] || ''}
                      onChange={(e) => handleNameChange(fieldId, e.target.value)}
                      onBlur={() => handleSave(fieldId)}
                      autoFocus
                    />
                  ) : (
                    <Text fontWeight="fontWeightDemiBold">{contentBlockNames[fieldId]}</Text>
                  )}
                </Stack>
                <IconButton
                  size="small"
                  variant="secondary"
                  icon={<EditIcon />}
                  aria-label="Edit content block"
                  onClick={() => handleEdit(fieldId)}
                />
              </Flex>
            </Card>
          ))}
        </Stack>
      </Box>
      <WizardFooter>
        <Button variant="secondary" size="small" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button variant="primary" onClick={() => handleNextStep(contentBlockNames)}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default CreateStep;
