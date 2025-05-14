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
  Note,
} from '@contentful/f36-components';
import { EditIcon } from '@contentful/f36-icons';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';
import { useState, useEffect } from 'react';
import { editButton } from './CreateStep.styles';
import { DialogAppSDK } from '@contentful/app-sdk';
import { PlainClientAPI } from 'contentful-management';

interface CreateStepProps {
  entry: Entry;
  sdk: DialogAppSDK;
  cma: PlainClientAPI;
  selectedFields: Set<string>;
  contentBlockNames: Record<string, string>;
  setContentBlockNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: (contentBlockNames: Record<string, string>) => void;
}

const getDefaultContentBlockName = (entry: Entry, fieldId: string) => {
  const entryTitle = entry.title || 'Untitled';
  return `${entryTitle.replace(/\s+/g, '-')}-${fieldId}`;
};

const CreateStep = ({
  entry,
  sdk,
  cma,
  selectedFields,
  isSubmitting,
  contentBlockNames,
  setContentBlockNames,
  handlePreviousStep,
  handleNextStep,
}: CreateStepProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [existingFields, setExistingFields] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Initialize content block names with defaults
    const initialNames: Record<string, string> = {};
    selectedFields.forEach((fieldId) => {
      initialNames[fieldId] = getDefaultContentBlockName(entry, fieldId);
    });
    setContentBlockNames(initialNames);
  }, [entry, selectedFields]);

  const handleEdit = (fieldId: string) => {
    setEditingField(fieldId);
  };

  const handleNameChange = (fieldId: string, value: string) => {
    setContentBlockNames((prev) => {
      return {
        ...prev,
        [fieldId]: value,
      };
    });
  };

  const handleSendToBraze = async () => {
    try {
      console.log('Executing get list of content blocks');
      const listResponse = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'listContentBlocksAction',
        },
        {
          parameters: {},
        }
      );
      const listResults = JSON.parse(listResponse.response.body);

      const existingCodeBlockNames = Object.keys(contentBlockNames).filter((name) =>
        listResults.contentBlocks.some((block: any) => block.id === name)
      );

      if (existingCodeBlockNames.length > 0) {
        setExistingFields(existingCodeBlockNames);
        setHasError(true);
      } else {
        setHasError(false);
        handleNextStep(contentBlockNames);
      }

      console.log('Finished executing get list of content blocks', listResults);
      console.log('Existing content blocks', existingCodeBlockNames);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Box>
        {hasError && (
          <Note variant="negative" title="There was an issue">
            Some content block names already exist. Please change them to be unique.
          </Note>
        )}
        <Paragraph>
          Edit each field to change the name or add an optional description. When complete, send
          directly to Braze. Content Block names should be unique.
        </Paragraph>
        <Stack spacing="spacingS" flexDirection="column">
          {Array.from(selectedFields).map((fieldId: string) => (
            <Card
              key={fieldId}
              margin="none"
              style={{
                padding: 'spacingXs',
                borderColor: hasError && existingFields.includes(fieldId) ? 'red' : undefined,
              }}>
              <Flex justifyContent="space-between">
                <Stack spacing="spacing2Xs" flexDirection="column" alignItems="flex-start">
                  {editingField === fieldId ? (
                    <FormControl isRequired>
                      <FormControl.Label>Name</FormControl.Label>
                      <TextInput
                        value={contentBlockNames[fieldId] || ''}
                        onChange={(e) => handleNameChange(fieldId, e.target.value)}
                        autoFocus
                      />
                      <FormControl.HelpText>Name should be unique.</FormControl.HelpText>
                    </FormControl>
                  ) : (
                    <>
                      <Text>Name</Text>
                      <Text fontWeight="fontWeightDemiBold">{contentBlockNames[fieldId]}</Text>
                    </>
                  )}
                </Stack>
                <IconButton
                  size="small"
                  variant="secondary"
                  icon={<EditIcon />}
                  aria-label="Edit content block"
                  onClick={() => handleEdit(fieldId)}
                  className={editButton}
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
        <Button variant="primary" onClick={handleSendToBraze}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default CreateStep;
