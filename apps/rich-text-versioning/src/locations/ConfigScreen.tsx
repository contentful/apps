import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Heading,
  Note,
  Paragraph,
  TextLink,
  FormControl,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import ContentfulApiKeyInput, {
  validateContentfulApiKey,
} from '../components/ContentfulApiKeyInput';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { ContentType, getRichTextFields, TargetState } from '../utils';

interface RichTextFieldWithContext {
  id: string;
  name: string;
  contentTypeId: string;
  contentTypeName: string;
  displayName: string;
}

interface AppInstallationParameters {
  contentfulApiKey: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    contentfulApiKey: '',
  });
  const [contentfulApiKeyIsValid, setContentfulApiKeyIsValid] = useState(true);
  const [selectedRichTextFields, setSelectedRichTextFields] = useState<RichTextFieldWithContext[]>(
    []
  );
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const isContentfulKeyValid = await validateContentfulApiKey(parameters.contentfulApiKey, sdk);
    setContentfulApiKeyIsValid(isContentfulKeyValid);

    if (!isContentfulKeyValid) {
      sdk.notifier.error('The app configuration was not saved. Please try again.');
      return false;
    }

    const targetState: TargetState = {
      EditorInterface: {},
    };

    // Group selected fields by content type
    const fieldsByContentType = selectedRichTextFields.reduce((acc, field) => {
      if (!acc[field.contentTypeId]) {
        acc[field.contentTypeId] = [];
      }
      acc[field.contentTypeId].push(field);
      return acc;
    }, {} as Record<string, RichTextFieldWithContext[]>);

    // Apply the app to selected content types with their specific fields
    for (const [contentTypeId, fields] of Object.entries(fieldsByContentType)) {
      targetState.EditorInterface[contentTypeId] = {
        controls: fields.map((field) => ({
          fieldId: field.name, // Use the field name (not the combined ID)
        })),
      };
    }

    return {
      parameters,
      targetState,
    };
  }, [parameters, selectedRichTextFields, sdk]);

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

  return (
    <Flex justifyContent="center" alignItems="flex-start" className={styles.configScreenContainer}>
      <Box margin="spacing2Xl">
        <Heading as="h2" marginBottom="spacingS">
          Set up Rich Text Versioning
        </Heading>
        <Paragraph marginBottom="spacingXl">
          This app allows content creators to visually compare changes in a rich text field against
          the last published version. A two-column view highlights added, removed, and modified
          content, including referenced entries and assets.
        </Paragraph>

        {/* Configure Access Section */}
        <Box marginBottom="spacing2Xl">
          <Box marginBottom="spacingL">
            <Heading as="h3" marginBottom="spacingXs">
              Configure access
            </Heading>
            <Paragraph marginBottom="spacing2Xs">
              Input the Contentful Delivery API - access token that will be used to request your
              content via API at send time.
            </Paragraph>
            <Box marginBottom="spacingM">
              <TextLink
                href={`https://app.contentful.com/spaces/${sdk.ids.space}/api/keys`}
                target="_blank"
                rel="noopener noreferrer"
                alignIcon="end"
                icon={<ExternalLinkIcon />}>
                Manage API keys
              </TextLink>
            </Box>
          </Box>
          <ContentfulApiKeyInput
            value={parameters.contentfulApiKey}
            onChange={(e) => {
              setParameters({ ...parameters, contentfulApiKey: e.target.value.trim() });
            }}
            isInvalid={!contentfulApiKeyIsValid}
          />
        </Box>

        {/* Assign Rich Text Fields Section */}
        <Box marginBottom="spacing2Xl">
          <Heading as="h3" marginBottom="spacingXs">
            Assign rich text fields
          </Heading>
          <Paragraph marginBottom="spacingL">
            Select the specific rich text fields you want to use with Rich Text Versioning. You can
            change this anytime by clicking 'Edit' on the rich text field type and adjust the
            Appearance settings in your content type.
          </Paragraph>

          <FormControl id="richTextFields">
            <FormControl.Label>Rich text fields</FormControl.Label>
            <ContentTypeMultiSelect
              selectedRichTextFields={selectedRichTextFields}
              setSelectedRichTextFields={setSelectedRichTextFields}
              sdk={sdk}
              cma={sdk.cma}
              filterContentTypes={(contentType) => {
                const richTextFields = getRichTextFields(contentType);
                return richTextFields.length > 0;
              }}
            />
          </FormControl>
        </Box>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
