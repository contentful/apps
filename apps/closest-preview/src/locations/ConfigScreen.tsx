import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex, Box, FormControl, Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { ContentType } from '../types';
import { styles } from './ConfigScreen.styles';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);

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
      targetState: {
        ...currentState,
        EditorInterface: editorInterface,
      },
    };
  }, [sdk, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      sdk.app.setReady();
    })();
  }, []);

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
                sdk={sdk}
                cma={sdk.cma}
              />
            </FormControl>
          </Box>
          <Note>
            This app assumes that all content types with Live Preview enabled include a field whose
            id is 'slug'. If that field is missing or uses a different id, the app will not function
            correctly.
          </Note>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
