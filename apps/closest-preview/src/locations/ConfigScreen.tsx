import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  Box,
  FormControl,
  Note,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { AppInstallationParameters, ContentType, DEFAULT_SLUG_FIELD_ID } from '../types';
import { styles } from './ConfigScreen.styles';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    slugFieldId: DEFAULT_SLUG_FIELD_ID,
  });

  const onConfigure = useCallback(async () => {
    const editorInterface = selectedContentTypes.reduce((acc, contentType) => {
      return {
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      };
    }, {});

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: {
        slugFieldId: parameters.slugFieldId.trim() || DEFAULT_SLUG_FIELD_ID,
      },
      targetState: {
        ...currentState,
        EditorInterface: editorInterface,
      },
    };
  }, [parameters.slugFieldId, sdk, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();

      if (currentParameters) {
        setParameters({
          slugFieldId: currentParameters.slugFieldId || DEFAULT_SLUG_FIELD_ID,
        });
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex justifyContent="center" alignItems="center">
      <Box margin="spacing2Xl" className={styles.body}>
        <Form>
          <Heading as="h2" marginBottom="spacingS">
            Set up Closest Preview
          </Heading>
          <Paragraph marginBottom="spacingXl">
            Closest Preview allows users to quickly navigate to the closest page level element for a
            given entry in order to preview the item.
          </Paragraph>

          <Box marginBottom="spacing2Xl">
            <Heading as="h3" marginBottom="spacingXs">
              Preview field
            </Heading>
            <Paragraph marginBottom="spacingL">
              Choose the field id used to identify page-level entries with Live Preview enabled. The
              default is <code>{DEFAULT_SLUG_FIELD_ID}</code>.
            </Paragraph>
            <FormControl id="slugFieldId" marginBottom="spacingL">
              <FormControl.Label>Preview field id</FormControl.Label>
              <TextInput
                name="slugFieldId"
                value={parameters.slugFieldId}
                onChange={(event) =>
                  setParameters({
                    slugFieldId: event.target.value,
                  })
                }
              />
              <FormControl.HelpText>
                Closest Preview will treat entries with this field populated as previewable pages.
              </FormControl.HelpText>
            </FormControl>
          </Box>

          <Box marginBottom="spacing2Xl">
            <Heading as="h3" marginBottom="spacingXs">
              Assign content types
            </Heading>
            <Paragraph marginBottom="spacingL">
              Select the content type(s) you want to use with Closest Preview. You can change this
              anytime by navigating to the 'Sidebar' tab in your content model.
            </Paragraph>
            <FormControl id="contentTypes">
              <FormControl.Label>Content types</FormControl.Label>
              <ContentTypeMultiSelect
                selectedContentTypes={selectedContentTypes}
                setSelectedContentTypes={setSelectedContentTypes}
                slugFieldId={parameters.slugFieldId.trim() || DEFAULT_SLUG_FIELD_ID}
                sdk={sdk}
                cma={sdk.cma}
              />
            </FormControl>
          </Box>
          <Note variant="neutral">
            This app treats content types with a populated <code>{parameters.slugFieldId}</code>{' '}
            field as previewable pages. Leave the default value if your page entries already use{' '}
            <code>{DEFAULT_SLUG_FIELD_ID}</code>.
          </Note>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
