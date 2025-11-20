import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  Heading,
  Paragraph,
  FormControl,
  TextInput,
  Autocomplete,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import OverrideSection from '../components/OverrideSection';
import {
  AppInstallationParameters,
  OverrideState,
  Override,
  AutocompleteItem,
} from '../utils/types';
import { getUniqueShortTextFields, normalizeString } from '../utils/override';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    separator: '',
    sourceFieldId: '',
    overrides: [],
  });

  const [isSourceFieldMissing, setIsSourceFieldMissing] = useState<boolean>(false);
  const [overridesAreInvalid, setOverridesAreInvalid] = useState<OverrideState>({});
  const [fields, setFields] = useState<AutocompleteItem[]>([]);
  const [filteredSourceFields, setFilteredSourceFields] = useState<AutocompleteItem[]>([]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    setIsSourceFieldMissing(!parameters.sourceFieldId);

    const overridesAreInvalid: OverrideState = {};
    parameters.overrides.forEach((override) => {
      overridesAreInvalid[override.id] = {
        isContentTypeMissing: !override.contentTypeId,
        isFieldMissing: !override.fieldId,
      };
    });
    setOverridesAreInvalid(overridesAreInvalid);

    const invalidOverrides = parameters.overrides.some(
      (override) => !override.contentTypeId || !override.fieldId
    );

    if (!parameters.sourceFieldId || invalidOverrides) {
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
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

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

  const handleOverridesChange = (updater: (prev: Override[]) => Override[]) => {
    setParameters((prev) => ({
      ...prev,
      overrides: updater(prev.overrides),
    }));
  };

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
          <FormControl id="sourceFieldId" isInvalid={isSourceFieldMissing}>
            <FormControl.Label marginBottom="spacingS" isRequired>
              Source field ID
            </FormControl.Label>
            <Autocomplete
              selectedItem={
                fields.find((field) => field.id === parameters.sourceFieldId)?.name || ''
              }
              items={filteredSourceFields.map((field) => field.name)}
              onInputValueChange={handleSourceFieldInputChange}
              onSelectItem={handleSourceFieldIdSelection}
              placeholder="Search field name"
            />
            {isSourceFieldMissing && (
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

        <OverrideSection
          overrides={parameters.overrides}
          overridesAreInvalid={overridesAreInvalid}
          onOverridesChange={handleOverridesChange}
        />
      </Flex>
    </Form>
  );
};

export default ConfigScreen;
