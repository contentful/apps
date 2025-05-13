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
type ContentBlockState = {
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
};

type ContentBlockViewProps = {
  name: string;
  onEdit: () => void;
};

type ContentBlockCardProps = {
  fieldId: string;
  entry: Entry;
  contentBlockState: ContentBlockState;
  isEditing: boolean;
  editDraft: { name: string; description: string };
  onEdit: (fieldId: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSave: (fieldId: string) => void;
};

type CreateStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  contentBlockStates: ContentBlockState;
  setContentBlockStates: Dispatch<SetStateAction<ContentBlockState>>;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: (contentBlockStates: ContentBlockState) => void;
};

// Utils
const getDefaultContentBlockName = (entry: Entry, fieldId: string) => {
  const entryTitle = entry.title || 'Untitled';
  return `${entryTitle.replace(/\s+/g, '-')}-${fieldId}`;
};

// Components
const ContentBlockForm = ({
  fieldId,
  entry,
  editDraft,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSave,
}: ContentBlockFormProps) => {
  return (
    <Stack flexDirection="column" style={{ width: '100%' }}>
      <FormControl isRequired style={{ width: '100%' }}>
        <FormControl.Label>Content Block name</FormControl.Label>
        <TextInput
          value={editDraft.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={getDefaultContentBlockName(entry, fieldId)}
          style={{ marginBottom: tokens.spacingS }}
          autoFocus
        />
        <FormControl.HelpText>Name should be unique.</FormControl.HelpText>
      </FormControl>
      <FormControl style={{ width: '100%' }}>
        <FormControl.Label>Description</FormControl.Label>
        <Textarea
          value={editDraft.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={3}
          style={{ marginBottom: tokens.spacing2Xs }}
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

const ContentBlockView = ({ name, onEdit }: ContentBlockViewProps) => {
  return (
    <Flex justifyContent="space-between">
      <Stack
        spacing="spacing2Xs"
        flexDirection="column"
        alignItems="flex-start"
        style={{ width: '100%' }}>
        <Text>Content Block name</Text>
        <Text fontWeight="fontWeightDemiBold">{name}</Text>
      </Stack>
      <IconButton
        size="small"
        variant="secondary"
        icon={<PencilSimple />}
        aria-label="Edit content block"
        onClick={onEdit}
        className={editButton}
      />
    </Flex>
  );
};

const ContentBlockCard = ({
  fieldId,
  entry,
  contentBlockState,
  isEditing,
  editDraft,
  onEdit,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSave,
}: ContentBlockCardProps) => {
  return (
    <Card margin="none" style={{ padding: tokens.spacingXs }}>
      {isEditing ? (
        <ContentBlockForm
          fieldId={fieldId}
          entry={entry}
          editDraft={editDraft}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          onCancel={onCancel}
          onSave={onSave}
        />
      ) : (
        <ContentBlockView
          name={contentBlockState.names[fieldId] || ''}
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
  contentBlockStates,
  setContentBlockStates,
  handlePreviousStep,
  handleNextStep,
}: CreateStepProps) => {
  // State
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });

  // Effects
  useEffect(() => {
    const initialStates: ContentBlockState = {
      names: {},
      descriptions: {},
    };
    selectedFields.forEach((fieldId) => {
      initialStates.names[fieldId] = getDefaultContentBlockName(entry, fieldId);
      initialStates.descriptions[fieldId] = '';
    });
    setContentBlockStates(initialStates);
  }, [entry, selectedFields]);

  // Early return: show skeleton if any field state is missing
  if (Array.from(selectedFields).some((fieldId) => !contentBlockStates.names[fieldId])) {
    return (
      <Box padding="spacingM">
        <Skeleton.Container>
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
      name: contentBlockStates.names[fieldId] || '',
      description: contentBlockStates.descriptions[fieldId] || '',
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
        name: contentBlockStates.names[editingField] || '',
        description: contentBlockStates.descriptions[editingField] || '',
      });
    }
  };

  const handleSave = (fieldId: string) => {
    setContentBlockStates((prev) => ({
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
        <Stack spacing="spacingS" flexDirection="column">
          {Array.from(selectedFields).map((fieldId: string) => (
            <ContentBlockCard
              key={fieldId}
              fieldId={fieldId}
              entry={entry}
              contentBlockState={contentBlockStates}
              isEditing={editingField === fieldId}
              editDraft={editDraft}
              onEdit={handleEdit}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
              onCancel={handleCancel}
              onSave={handleSave}
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
        <Button variant="primary" onClick={() => handleNextStep(contentBlockStates)}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default CreateStep;
