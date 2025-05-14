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
  FormControl,
  Textarea,
  Skeleton,
} from '@contentful/f36-components';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { editButton } from './CreateStep.styles';
import { PencilSimple } from '@phosphor-icons/react';
import tokens from '@contentful/f36-tokens';

const MAX_DESCRIPTION_LENGTH = 250;

// Types
type ContentBlockData = {
  names: Record<string, string>;
  descriptions: Record<string, string>;
};

type ContentBlockFormProps = {
  fieldId: string;
  entry: Entry;
  editDraft: { name: string; description: string };
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSave: (fieldId: string) => void;
  isNameValid: boolean;
};

type ContentBlockViewProps = {
  name: string;
  description: string;
  onEdit: () => void;
};

type ContentBlockCardProps = {
  fieldId: string;
  entry: Entry;
  contentBlocksData: ContentBlockData;
  isEditing: boolean;
  editDraft: { name: string; description: string };
  onEdit: (fieldId: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSave: (fieldId: string) => void;
  isNameValid: boolean;
};

type CreateStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  contentBlocksData: ContentBlockData;
  setContentBlocksData: Dispatch<SetStateAction<ContentBlockData>>;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: (contentBlocksData: ContentBlockData) => void;
};

// Utils
export const getDefaultContentBlockName = (entry: Entry, fieldId: string) => {
  const entryTitle = entry.title || 'Untitled';
  return `${entryTitle.replace(/\s+/g, '-')}-${fieldId}`;
};

const isValidContentBlockName = (name: string): boolean => {
  return /^[A-Za-z0-9_-]+$/.test(name);
};

// Components
const ContentBlockForm = ({
  fieldId,
  entry,
  editDraft,
  onNameChange,
  onDescriptionChange,
  onCancel,
  isNameValid,
  onSave,
}: ContentBlockFormProps) => {
  return (
    <Stack flexDirection="column" style={{ width: '100%' }}>
      <FormControl isRequired isInvalid={!isNameValid} style={{ width: '100%' }}>
        <FormControl.Label>Content Block name</FormControl.Label>
        <TextInput
          value={editDraft.name}
          data-testid="content-block-name-input"
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={getDefaultContentBlockName(entry, fieldId)}
          style={{ marginBottom: tokens.spacingS }}
          autoFocus
        />
        <FormControl.HelpText>Name should be unique</FormControl.HelpText>
        {!isNameValid && (
          <FormControl.ValidationMessage>
            Content Block name can only contain alphanumeric characters (A-Z, a-z, 0-9), dashes (-),
            and underscores (_).
          </FormControl.ValidationMessage>
        )}
      </FormControl>
      <FormControl style={{ width: '100%' }}>
        <FormControl.Label>Description</FormControl.Label>
        <Textarea
          value={editDraft.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={3}
          style={{ marginBottom: tokens.spacing2Xs }}
          data-testid="content-block-description-input"
        />
        <Text fontColor="gray500" fontSize="fontSizeS">
          {editDraft.description.length} / {MAX_DESCRIPTION_LENGTH}
        </Text>
      </FormControl>
      <Flex
        justifyContent="flex-end"
        style={{ gap: tokens.spacingS, marginTop: tokens.spacingS, width: '100%' }}>
        <Button
          variant="secondary"
          size="small"
          onClick={onCancel}
          style={{ marginRight: tokens.spacingS }}>
          Cancel
        </Button>
        <Button variant="secondary" size="small" onClick={() => onSave(fieldId)}>
          Save
        </Button>
      </Flex>
    </Stack>
  );
};

const ContentBlockView = ({ name, description, onEdit }: ContentBlockViewProps) => {
  return (
    <Flex justifyContent="space-between">
      <Stack
        spacing="spacingS"
        flexDirection="column"
        alignItems="flex-start"
        style={{ width: '100%' }}>
        <Stack spacing="spacingXs" flexDirection="column" alignItems="flex-start">
          <Text>Content Block name</Text>
          <Text fontWeight="fontWeightDemiBold">{name}</Text>
        </Stack>
        {description !== '' && (
          <Stack spacing="spacingXs" flexDirection="column" alignItems="flex-start">
            <Text>Description</Text>
            <Text fontWeight="fontWeightDemiBold">{description}</Text>
          </Stack>
        )}
      </Stack>
      <IconButton
        size="small"
        variant="secondary"
        icon={<PencilSimple size={16} />}
        aria-label="Edit content block"
        onClick={onEdit}
        className={editButton}
        withTooltip
        tooltipProps={{ content: 'Edit name or add a description' }}
      />
    </Flex>
  );
};

const ContentBlockCard = ({
  fieldId,
  entry,
  contentBlocksData,
  isEditing,
  editDraft,
  onEdit,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSave,
  isNameValid,
}: ContentBlockCardProps) => {
  return (
    <Card
      margin="none"
      style={{
        paddingTop: tokens.spacingXs,
        paddingBottom: tokens.spacingS,
        paddingLeft: tokens.spacingXs,
        paddingRight: tokens.spacingXs,
      }}>
      {isEditing ? (
        <ContentBlockForm
          fieldId={fieldId}
          entry={entry}
          editDraft={editDraft}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          onCancel={onCancel}
          onSave={onSave}
          isNameValid={isNameValid}
        />
      ) : (
        <ContentBlockView
          name={contentBlocksData.names[fieldId] || ''}
          description={contentBlocksData.descriptions[fieldId] || ''}
          onEdit={() => onEdit(fieldId)}
        />
      )}
    </Card>
  );
};

// Main Component
const CreateStep = ({
  entry,
  selectedFields,
  isSubmitting,
  contentBlocksData,
  setContentBlocksData,
  handlePreviousStep,
  handleNextStep,
}: CreateStepProps) => {
  // State
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });
  const [isNameValid, setIsNameValid] = useState(true);

  // Effects
  useEffect(() => {
    const initialStates: ContentBlockData = {
      names: {},
      descriptions: {},
    };
    selectedFields.forEach((fieldId) => {
      initialStates.names[fieldId] = getDefaultContentBlockName(entry, fieldId);
      initialStates.descriptions[fieldId] = '';
    });
    setContentBlocksData(initialStates);
  }, [entry, selectedFields]);

  // Early return: show skeleton if any field state is missing
  if (Array.from(selectedFields).some((fieldId) => !contentBlocksData.names[fieldId])) {
    return (
      <Box padding="spacingM">
        <Skeleton.Container data-testid="cf-ui-skeleton-form">
          <Skeleton.BodyText numberOfLines={2} />
          <Skeleton.Image width={200} height={32} />
          <Skeleton.BodyText numberOfLines={1} />
        </Skeleton.Container>
      </Box>
    );
  }

  // Event Handlers
  const handleEdit = (fieldId: string) => {
    setEditingField(fieldId);
    setEditDraft({
      name: contentBlocksData.names[fieldId] || '',
      description: contentBlocksData.descriptions[fieldId] || '',
    });
  };

  const handleNameChange = (value: string) => {
    setEditDraft((prev) => ({ ...prev, name: value }));
  };

  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setEditDraft((prev) => ({ ...prev, description: value }));
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    if (editingField) {
      setEditDraft({
        name: contentBlocksData.names[editingField] || '',
        description: contentBlocksData.descriptions[editingField] || '',
      });
    }
  };

  const handleSave = (fieldId: string) => {
    if (!isValidContentBlockName(editDraft.name)) {
      setIsNameValid(false);
      return;
    }
    setIsNameValid(true);
    setContentBlocksData((prev) => ({
      names: { ...prev.names, [fieldId]: editDraft.name },
      descriptions: { ...prev.descriptions, [fieldId]: editDraft.description },
    }));
    setEditingField(null);
    setEditDraft({ name: '', description: '' });
  };

  return (
    <>
      <Box>
        <Paragraph>
          Edit each field to change the name or add an optional description. When complete, send
          directly to Braze. Content Block names should be unique.
        </Paragraph>
        <Stack spacing="spacingM" flexDirection="column">
          {Array.from(selectedFields).map((fieldId: string) => (
            <ContentBlockCard
              key={fieldId}
              fieldId={fieldId}
              entry={entry}
              contentBlocksData={contentBlocksData}
              isEditing={editingField === fieldId}
              editDraft={editDraft}
              onEdit={handleEdit}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
              onCancel={handleCancel}
              onSave={handleSave}
              isNameValid={isNameValid}
            />
          ))}
        </Stack>
      </Box>
      <WizardFooter>
        <Button
          variant="secondary"
          size="small"
          onClick={handlePreviousStep}
          data-testid="back-button">
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => handleNextStep(contentBlocksData)}
          isDisabled={editingField !== null}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default CreateStep;
