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
  Icon,
} from '@contentful/f36-components';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { editButton } from './CreateStep.styles';
import { PencilSimple, CheckCircle, WarningOctagon } from '@phosphor-icons/react';
import tokens from '@contentful/f36-tokens';
import CreateButton from './CreateButton';
import { ContentBlockData, CreationResultField } from './CreateFlow';
import { localizeFieldId } from '../../utils';

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 250;

// Types
type ContentBlockFormProps = {
  fieldId: string;
  locale?: string;
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
  isCreated?: boolean;
  error?: string;
};

type ContentBlockCardProps = {
  fieldId: string;
  locale?: string;
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
  isCreated?: boolean;
  error?: string;
};

type CreateStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  selectedLocales?: string[];
  contentBlocksData: ContentBlockData;
  setContentBlocksData: Dispatch<SetStateAction<ContentBlockData>>;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: (contentBlocksData: ContentBlockData) => void;
  creationResultFields: CreationResultField[];
};

// Utils
export const getDefaultContentBlockName = (entry: Entry, fieldId: string, locale?: string) => {
  const entryTitle = entry.title || 'Untitled';
  fieldId = localizeFieldId(fieldId, locale);
  // TODO: remove other special characters
  return `${entryTitle.replace(/\s+/g, '-')}-${fieldId}`;
};

const isValidContentBlockName = (name: string): boolean => {
  return /^[A-Za-z0-9_-]+$/.test(name);
};

// Components
const ContentBlockForm = ({
  fieldId,
  locale,
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
          maxLength={MAX_NAME_LENGTH}
          placeholder={getDefaultContentBlockName(entry, fieldId, locale)}
          style={{ marginBottom: tokens.spacingS }}
          autoFocus
        />
        <Text fontColor="gray500" fontSize="fontSizeS">
          {editDraft.name.length} / {MAX_NAME_LENGTH}
        </Text>
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
        <Button
          variant="secondary"
          size="small"
          onClick={() => onSave(localizeFieldId(fieldId, locale))}>
          Save
        </Button>
      </Flex>
    </Stack>
  );
};

const ContentBlockView = ({
  name,
  description,
  onEdit,
  isCreated,
  error,
}: ContentBlockViewProps) => {
  return (
    <Flex justifyContent="space-between">
      <Stack
        spacing="spacingS"
        flexDirection="column"
        alignItems="flex-start"
        style={{ width: '100%' }}>
        <Stack spacing="spacingXs" flexDirection="column" alignItems="flex-start">
          <Text>Content Block name</Text>
          <Flex alignItems="center" style={{ gap: tokens.spacing2Xs }}>
            {isCreated && <Icon as={CheckCircle} variant="positive" size="tiny" />}
            {error && <Icon as={WarningOctagon} variant="negative" size="tiny" />}
            <Text fontWeight="fontWeightMedium">{name}</Text>
          </Flex>
          {error && (
            <Text fontColor="red600" fontSize="fontSizeS">
              {error}
            </Text>
          )}
        </Stack>
        {description !== '' && (
          <Stack spacing="spacingXs" flexDirection="column" alignItems="flex-start">
            <Text>Description</Text>
            <Text fontWeight="fontWeightDemiBold">{description}</Text>
          </Stack>
        )}
      </Stack>
      {!isCreated && (
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
      )}
    </Flex>
  );
};

const ContentBlockCard = ({
  fieldId,
  locale,
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
  isCreated,
  error,
}: ContentBlockCardProps) => {
  const localizedFieldId = localizeFieldId(fieldId, locale);
  return (
    <Card
      margin="none"
      style={{
        paddingTop: tokens.spacingXs,
        paddingBottom: tokens.spacingS,
        paddingLeft: tokens.spacingXs,
        paddingRight: tokens.spacingXs,
        borderColor: error ? tokens.red600 : undefined,
      }}>
      {isEditing ? (
        <ContentBlockForm
          fieldId={fieldId}
          locale={locale}
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
          name={contentBlocksData.names[localizedFieldId] || ''}
          description={contentBlocksData.descriptions[localizedFieldId] || ''}
          onEdit={() => onEdit(localizedFieldId)}
          isCreated={isCreated}
          error={error}
        />
      )}
    </Card>
  );
};

// Main Component
const CreateStep = ({
  entry,
  selectedFields,
  selectedLocales,
  isSubmitting,
  contentBlocksData,
  setContentBlocksData,
  handlePreviousStep,
  handleNextStep,
  creationResultFields,
}: CreateStepProps) => {
  // State
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });
  const [isNameValid, setIsNameValid] = useState(true);

  const localesList = selectedLocales ? selectedLocales : [undefined];
  const localizedFieldsIds = Array.from(selectedFields).flatMap((fieldId) => {
    const isLocalized = entry.fields.find((f) => f.id === fieldId)?.localized || false;
    if (!isLocalized) {
      return [localizeFieldId(fieldId, undefined)];
    }
    return localesList.map((locale) => localizeFieldId(fieldId, locale));
  });

  // Effects
  useEffect(() => {
    const initialStates: ContentBlockData = {
      names: {},
      descriptions: {},
    };
    selectedFields.forEach((fieldId) => {
      const isLocalized = entry.fields.find((f) => f.id === fieldId)?.localized || false;
      if (!isLocalized) {
        initialStates.names[fieldId] = getDefaultContentBlockName(entry, fieldId);
        initialStates.descriptions[fieldId] = '';
      } else {
        localesList.forEach((locale) => {
          const localizedFieldId = localizeFieldId(fieldId, locale);
          initialStates.names[localizedFieldId] = getDefaultContentBlockName(
            entry,
            fieldId,
            locale
          );
          initialStates.descriptions[localizedFieldId] = '';
        });
      }
    });
    setContentBlocksData(initialStates);
  }, [entry, selectedFields]);

  // Early return: show skeleton if any field state is missing
  if (localizedFieldsIds.some((fieldId) => !contentBlocksData.names[fieldId])) {
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
          {Array.from(selectedFields).flatMap((fieldId) => {
            const isLocalized = entry.fields.find((f) => f.id === fieldId)?.localized || false;
            const fieldLocales = isLocalized ? localesList : [undefined];

            return fieldLocales.map((locale) => {
              const localizedFieldId = localizeFieldId(fieldId, locale);
              return (
                <ContentBlockCard
                  key={localizedFieldId}
                  fieldId={fieldId}
                  locale={locale}
                  entry={entry}
                  contentBlocksData={contentBlocksData}
                  isEditing={editingField === localizedFieldId}
                  editDraft={editDraft}
                  onEdit={handleEdit}
                  onNameChange={handleNameChange}
                  onDescriptionChange={handleDescriptionChange}
                  onCancel={handleCancel}
                  onSave={handleSave}
                  isNameValid={isNameValid}
                  isCreated={creationResultFields.some(
                    (result) =>
                      result.success &&
                      localizedFieldId === localizeFieldId(result.fieldId, result.locale)
                  )}
                  error={
                    creationResultFields.find(
                      (result) =>
                        localizedFieldId === localizeFieldId(result.fieldId, result.locale)
                    )?.message
                  }
                />
              );
            });
          })}
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
        <CreateButton
          isLoading={isSubmitting}
          onClick={() => handleNextStep(contentBlocksData)}
          isDisabled={editingField !== null}
        />
      </WizardFooter>
    </>
  );
};

export default CreateStep;
