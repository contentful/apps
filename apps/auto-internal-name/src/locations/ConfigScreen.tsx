import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  Box,
  FormControl,
  TextInput,
  Autocomplete,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import ContentTypeOverrides from '../components/ContentTypeOverrides';
import { Override, OverrideError } from '../utils/types';
import { getUniqueShortTextFields, normalizeString } from '../utils/override';

type AppParameters = {
  separator: string;
  sourceFieldId: string;
  overrides: Override[];
};

type SimplifiedField = { id: string; name: string };

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppParameters>({
    separator: '',
    sourceFieldId: '',
    overrides: [],
  });

  const [filteredSourceFields, setFilteredSourceFields] = useState<SimplifiedField[]>([]);
  const [fields, setFields] = useState<SimplifiedField[]>([]);

  const [sourceFieldError, setSourceFieldError] = useState<boolean>(false);
  const [overrideErrors, setOverrideErrors] = useState<Record<string, OverrideError>>({});

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const newSourceFieldError = !parameters.sourceFieldId;
    setSourceFieldError(newSourceFieldError);

    const newOverrideErrors: Record<string, OverrideError> = {};
    parameters.overrides.forEach((override) => {
      newOverrideErrors[override.id] = {
        isContentTypeMissing: !override.contentTypeId,
        isFieldMissing: !override.fieldId,
      };
    });
    setOverrideErrors(newOverrideErrors);

    const hasOverrideErrors = Object.values(newOverrideErrors).some(
      (error) => error.isContentTypeMissing || error.isFieldMissing
    );
    if (newSourceFieldError || hasOverrideErrors) {
      sdk.notifier.error('Some fields are missing or invalid');
      return false;
    }

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    (async () => {
      try {
        const contentTypes = await sdk.cma.contentType.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        const uniqueFields = getUniqueShortTextFields(contentTypes);

        setFields(uniqueFields);
        setFilteredSourceFields(uniqueFields);
      } catch (error) {
        console.warn('[Error] Failed to load source fields:', error);
      }
    })();
  }, [sdk]);

  const handleSourceFieldInputChange = (name: string) => {
    if (!name) {
      setParameters((prev) => ({ ...prev, sourceFieldId: '' }));
      setFilteredSourceFields(fields);
      return;
    }

    const newFilteredItems = fields.filter((item) =>
      normalizeString(item.name).includes(normalizeString(name))
    );
    setFilteredSourceFields(newFilteredItems);
  };

  const handleSourceFieldIdSelection = (value: string) => {
    const selectedField = fields.find(
      (item) => normalizeString(item.name) === normalizeString(value)
    );
    if (selectedField) {
      setParameters((prev) => ({ ...prev, sourceFieldId: selectedField.id }));
    }
  };

  const handleOverridesChange = (updater: (prev: Override[]) => Override[]) => {
    setParameters((prev) => ({
      ...prev,
      overrides: updater(prev.overrides),
    }));
  };

  return (
    <Form>
      <Flex
        className={styles.container}
        flexDirection="column"
        alignItems="flex-start"
        gap="spacingXl"
        marginTop="spacing2Xl">
        <Box>
          <Heading as="h2" marginBottom="spacingS">
            Set up Auto Internal Name
          </Heading>
          <Paragraph>
            This app allows you to automatically set the name of an entry based on a field from its
            parent entry. Provide the ID of the field you wish to use as the source field on the
            parent.
          </Paragraph>
        </Box>

        <Box>
          <Heading as="h3">Configure</Heading>
          <FormControl id="separator">
            <FormControl.Label marginBottom="spacingS">Separator</FormControl.Label>
            <TextInput
              value={parameters.separator}
              onChange={(e) => setParameters((prev) => ({ ...prev, separator: e.target.value }))}
            />
            <FormControl.HelpText marginTop="spacingS">
              The separator can be any character or symbol and will append to the entry name.
            </FormControl.HelpText>
          </FormControl>
          <FormControl id="sourceFieldId" isInvalid={sourceFieldError}>
            <FormControl.Label marginBottom="spacingS" isRequired>
              Source field ID
            </FormControl.Label>
            <Autocomplete
              selectedItem={parameters.sourceFieldId}
              items={filteredSourceFields.map((field) => field.name)}
              onInputValueChange={handleSourceFieldInputChange}
              onSelectItem={handleSourceFieldIdSelection}
              placeholder="Search field name"
            />
            {sourceFieldError && (
              <FormControl.ValidationMessage>
                Source field ID is required
              </FormControl.ValidationMessage>
            )}
            <FormControl.HelpText marginTop="spacingS">
              The source field ID should be the name of the field that you want to use from the
              parent entry. This will be applied to any content types that include the same field
              ID.
            </FormControl.HelpText>
          </FormControl>
        </Box>

        <ContentTypeOverrides
          overrides={parameters.overrides}
          overrideErrors={overrideErrors}
          onOverridesChange={handleOverridesChange}
        />
      </Flex>
    </Form>
  );
};

export default ConfigScreen;
