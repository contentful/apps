import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Autocomplete,
  Box,
  Button,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  TextInput,
  Tooltip,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@contentful/f36-icons';
import { styles } from './ConfigScreen.styles';
import { ContentTypeProps } from 'contentful-management';
import OverrideRow from '../components/OverrideRow';
import { Override, OverrideIsInvalid } from '../utils/types';
import { normalizeString } from '../utils/override';

type AppParameters = {
  separator: string;
  sourceFieldId: string;
  overrides: Override[];
};

type SimplifiedField = { id: string; name: string };
type OverrideState = Record<string, OverrideIsInvalid>;

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppParameters>({
    separator: '',
    sourceFieldId: '',
    overrides: [],
  });

  const [filteredSourceFields, setFilteredSourceFields] = useState<SimplifiedField[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [fields, setFields] = useState<SimplifiedField[]>([]);

  const [isSourceFieldMissing, setIsSourceFieldMissing] = useState<boolean>(false);
  const [overridesAreInvalid, setOverridesAreInvalid] = useState<OverrideState>({});

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    setIsSourceFieldMissing(!parameters.sourceFieldId);

    const overridesAreInvalid: Record<string, OverrideIsInvalid> = {};
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

        const fields = contentTypes.items.flatMap((contentType) =>
          contentType.fields.map((field) => ({ id: field.id, name: field.name }))
        );

        const uniqueFields = Array.from(new Map(fields.map((field) => [field.id, field])).values());

        setContentTypes(contentTypes.items);
        setFields(uniqueFields);
        setFilteredSourceFields(uniqueFields);
      } catch (error) {
        console.warn('[Error] Failed to load source fields:', error);
      }
    })();
  }, []);

  const maxOverridesReached = () => {
    return (
      contentTypes.every((ct) => parameters.overrides.some((o) => o.contentTypeId === ct.sys.id)) ||
      contentTypes.length <= parameters.overrides.length
    );
  };

  const addOverride = () => {
    setParameters((prev) => ({
      ...prev,
      overrides: [
        ...prev.overrides,
        { id: window.crypto.randomUUID(), contentTypeId: '', fieldId: '' },
      ],
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

  const setOverrides = (updater: (prev: Override[]) => Override[]) => {
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
          <FormControl id="sourceFieldId" isInvalid={isSourceFieldMissing}>
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

        <Flex flexDirection="column" fullWidth>
          <Heading as="h3">Overrides</Heading>
          <Paragraph>
            If an override is needed per content type, select the content type and the field name
            you wish to use for each entry.
          </Paragraph>
          {parameters.overrides?.map((override) => (
            <OverrideRow
              key={override.id}
              contentTypes={contentTypes}
              overrideItem={override}
              overrideIsInvalid={overridesAreInvalid[override.id]}
              overrides={parameters.overrides}
              setOverrides={setOverrides}></OverrideRow>
          ))}
          <Box marginBottom="spacingXl">
            <Tooltip
              placement="right"
              id="tooltip-1"
              content={maxOverridesReached() ? 'No more content types available.' : undefined}>
              <Button
                aria-label="Add override"
                startIcon={<PlusIcon />}
                isDisabled={maxOverridesReached()}
                onClick={() => addOverride()}>
                Add override
              </Button>
            </Tooltip>
          </Box>
        </Flex>
      </Flex>
    </Form>
  );
};

export default ConfigScreen;
