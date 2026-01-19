import { useCallback, useState, useEffect } from 'react';
import {
  Heading,
  Stack,
  FormControl,
  TextInput,
  Radio,
  Paragraph,
  Flex,
  Box,
  Subheading,
  Switch,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppParameters } from '../vite-env';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { styles } from './ConfigScreen.styles';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import ReferenceOnlyMultiSelect from '../components/ReferenceOnlyMultiSelect';
import { ContentType } from '../types';

function ConfigScreen() {
  const [parameters, setParameters] = useState<AppParameters>({
    cloneText: 'Copy',
    cloneTextBefore: true,
    automaticRedirect: true,
    referenceOnlyComponents: [],
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    (async () => {
      const currentParameters: AppParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters({ ...parameters, ...currentParameters });
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const onConfigure = useCallback(async () => {
    if (!parameters.cloneText?.trim()) {
      sdk.notifier.error('The app configuration was not saved. Please try again.');
      return false;
    }
    const editorInterface = selectedContentTypes.reduce((acc, contentType) => {
      return {
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      };
    }, {});

    return {
      parameters,
      targetState: { EditorInterface: { ...editorInterface } },
    };
  }, [parameters, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  const setReferenceOnlyComponents = (referenceOnlyComponents: ContentType[]) => {
    setParameters({ ...parameters, referenceOnlyComponents: referenceOnlyComponents });
  };

  return (
    <Flex justifyContent="center" alignItems="center">
      <Box marginBottom="spacing2Xl" marginTop="spacing2Xl" className={styles.body}>
        <Heading marginBottom="spacingS">Set up Deep Clone</Heading>
        <Paragraph>
          Deep Clone enables users to duplicate an entry along with its entire reference tree,
          automatically copying all linked entries and preserving their structure.
        </Paragraph>

        <Subheading marginTop="spacingXl" marginBottom="spacing2Xs">
          Assign content types
        </Subheading>
        <Paragraph marginBottom="spacingM">
          The Deep Clone app will only be enabled for the content types you assign. The sidebar
          widget will be displayed on these entry pages.
        </Paragraph>
        <Paragraph fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
          Content types
        </Paragraph>
        <ContentTypeMultiSelect
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={sdk}
          cma={sdk.cma}
        />

        <Subheading marginTop="spacingXl" marginBottom="spacing2Xs">
          Components can not be cloned
        </Subheading>
        <Paragraph marginBottom="spacingM">
          Checked components will be treated as reference-only and will not be selectable on Select
          Component Tree while using clone feature.
        </Paragraph>
        <ReferenceOnlyMultiSelect
          selectedContentTypes={parameters.referenceOnlyComponents}
          setSelectedContentTypes={setReferenceOnlyComponents}
          sdk={sdk}
          cma={sdk.cma}
        />

        <Subheading marginTop="spacing2Xl" marginBottom="spacingL">
          Naming
        </Subheading>

        <FormControl isRequired isInvalid={!parameters.cloneText}>
          <FormControl.Label className={styles.textInputLabel}>Clone text</FormControl.Label>
          <TextInput
            value={parameters.cloneText}
            name="cloneText"
            type="text"
            onChange={(e) => setParameters({ ...parameters, cloneText: e.target.value })}
          />
          <FormControl.HelpText>
            This text will display at the beginning or end of the cloned entry name
          </FormControl.HelpText>
          {!parameters.cloneText && (
            <FormControl.ValidationMessage>
              Please, provide a clone text
            </FormControl.ValidationMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!parameters.cloneTextBefore}>
          <FormControl.Label className={styles.textInputLabel} marginBottom="spacingM">
            Display "clone text" before or after the cloned entry's name?
          </FormControl.Label>

          <Stack flexDirection="column" alignItems="start" spacing="spacingXs">
            <Radio
              id="cloneTextBefore"
              testId="cloneTextBefore"
              name="clone-text-before"
              isChecked={parameters.cloneTextBefore}
              onChange={() => setParameters({ ...parameters, cloneTextBefore: true })}>
              Before
            </Radio>
            <Radio
              id="cloneTextAfter"
              testId="cloneTextAfter"
              name="clone-text-before"
              isChecked={!parameters.cloneTextBefore}
              onChange={() => setParameters({ ...parameters, cloneTextBefore: false })}>
              After
            </Radio>
          </Stack>
        </FormControl>

        <Subheading marginTop="spacing2Xl" marginBottom="spacingL">
          Redirect
        </Subheading>

        <FormControl isInvalid={!parameters.automaticRedirect}>
          <Switch
            id="automaticRedirect"
            name="automatic-redirect"
            isChecked={parameters.automaticRedirect}
            onChange={(e) => setParameters({ ...parameters, automaticRedirect: e.target.checked })}
            helpText="Enable automatic redirect 3 seconds after the entry is cloned">
            Automatic redirect
          </Switch>
        </FormControl>

        <Subheading marginTop="spacing2Xl" marginBottom="spacingL">
          Getting started
        </Subheading>
        <Paragraph>
          To use Deep Clone, you must add the app to your entry sidebar. Navigate to the content
          model, select a content type and click on Sidebar.
        </Paragraph>
      </Box>
    </Flex>
  );
}

export default ConfigScreen;
