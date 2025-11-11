import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  Box,
  FormControl,
  TextInput,
  Button,
  Autocomplete,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@contentful/f36-icons';
import { styles } from './ConfigScreen.styles';
import { ContentTypeProps } from 'contentful-management';
import OverrideRow from '../components/OverrideRow';
import { Override } from '../utils/consts';
import { normalizeString } from '../utils/override';

type AppParameters = {
  separator: string;
  sourceFieldId: string;
  overrides: Override[];
};

type SimplifiedField = { id: string; name: string };

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [separator, setSeparator] = useState<string>('');
  const [sourceFieldId, setSourceFieldId] = useState<string>('');
  const [overrides, setOverrides] = useState<Override[]>([]);

  const [filteredSourceFields, setFilteredSourceFields] = useState<SimplifiedField[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [fields, setFields] = useState<SimplifiedField[]>([]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: { separator, sourceFieldId, overrides },
      targetState: currentState,
    };
  }, [separator, sourceFieldId, overrides, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppParameters | null = await sdk.app.getParameters();

      console.log(currentParameters);
      console.log(currentParameters?.separator);
      console.log(currentParameters?.sourceFieldId);
      console.log(currentParameters?.overrides);

      if (currentParameters) {
        setSeparator(currentParameters.separator || '');
        setSourceFieldId(currentParameters.sourceFieldId || '');
        setOverrides(currentParameters.overrides || []);
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

  const addOverride = () => {
    setOverrides((prev) => [
      ...prev,
      { id: window.crypto.randomUUID(), contentTypeId: '', fieldName: '' },
    ]);
  };

  const handleSourceFieldInputChange = (name: string) => {
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
      setSourceFieldId(selectedField.id);
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
            parent, and a preview token to access the parent entry.
          </Paragraph>
        </Box>

        <Box>
          <Heading as="h3">Configure</Heading>
          <FormControl id="separator">
            <FormControl.Label marginBottom="spacingS">Separator</FormControl.Label>
            <TextInput value={separator} onChange={(e) => setSeparator(e.target.value)}></TextInput>
            <Paragraph marginTop="spacingS" fontColor="gray500">
              The separator can be any character or symbol and will append to the entry name.
            </Paragraph>
          </FormControl>
          <FormControl id="sourceFieldId">
            <FormControl.Label marginBottom="spacingS">Source field ID</FormControl.Label>
            <Autocomplete
              selectedItem={sourceFieldId}
              items={filteredSourceFields.map((field) => field.name)}
              onInputValueChange={handleSourceFieldInputChange}
              onSelectItem={handleSourceFieldIdSelection}
              placeholder="Search field name"
            />
            <Paragraph marginTop="spacingS" fontColor="gray500">
              The source field ID should be the name of the field that you want to use from the
              parent entry. This will be applied to any content types that include the same field
              ID.
            </Paragraph>
          </FormControl>
        </Box>

        <Flex flexDirection="column" fullWidth>
          <Heading as="h3">Overrides</Heading>
          <Paragraph>
            If an override is needed per content type, select the content type and the field name
            you wish to use for each entry.
          </Paragraph>
          {overrides?.map((override) => (
            <OverrideRow
              key={override.id}
              contentTypes={contentTypes}
              overrideItem={override}
              setOverrides={setOverrides}></OverrideRow>
          ))}
          <Box marginBottom="spacingXl">
            <Button
              aria-label="Add override"
              startIcon={<PlusIcon />}
              onClick={() => addOverride()}>
              Add override
            </Button>
          </Box>
        </Flex>
      </Flex>
    </Form>
  );
};

export default ConfigScreen;
