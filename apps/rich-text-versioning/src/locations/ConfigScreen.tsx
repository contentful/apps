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
import {
  getRichTextFields,
  TargetState,
  RichTextFieldWithContext,
  processContentTypesToFields,
  restoreSelectedFields,
} from '../utils';
import { ContentTypeProps } from 'contentful-management';

interface AppInstallationParameters {
  contentfulApiKey: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    contentfulApiKey: '',
  });
  const [contentfulApiKeyIsValid, setContentfulApiKeyIsValid] = useState(true);
  const [availableFields, setAvailableFields] = useState<RichTextFieldWithContext[]>([]);
  const [selectedFields, setSelectedFields] = useState<RichTextFieldWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sdk = useSDK<ConfigAppSDK>();

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    let allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await sdk.cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    return allContentTypes;
  };

  const loadFieldsAndRestoreState = async () => {
    try {
      setIsLoading(true);

      // Fetch content types and process them into fields
      const contentTypes = await fetchAllContentTypes();
      const fields = processContentTypesToFields(
        contentTypes.filter((ct) => getRichTextFields(ct).length > 0)
      );

      // Restore selected fields from saved state
      const currentState = (await sdk.app.getCurrentState()) || { EditorInterface: {} };
      const restoredFields = restoreSelectedFields(fields, currentState);

      setAvailableFields(fields);
      if (restoredFields.length > 0) {
        setSelectedFields(restoredFields);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    const fieldsByContentType = selectedFields.reduce<Record<string, RichTextFieldWithContext[]>>(
      (acc, field) => {
        if (!acc[field.contentTypeId]) {
          acc[field.contentTypeId] = [];
        }

        acc[field.contentTypeId].push(field);

        return acc;
      },
      {}
    );

    // Apply the app to selected content types with their specific fields
    for (const [contentTypeId, fields] of Object.entries(fieldsByContentType)) {
      targetState.EditorInterface[contentTypeId] = {
        controls: fields.map((field) => ({
          fieldId: field.fieldId,
        })),
      };
    }

    return {
      parameters,
      targetState,
    };
  }, [parameters, selectedFields, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }

      await loadFieldsAndRestoreState();
      sdk.app.setReady();
    })();
  }, [sdk]);

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center">
        <Box margin="spacing2Xl">
          <Paragraph>Loading rich text fields...</Paragraph>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex justifyContent="center" alignItems="center">
      <Flex justifyContent="center" className={styles.configScreenContainer}>
        <Box margin="spacingL">
          <Heading as="h2" marginBottom="spacingS">
            Set up Rich Text Versioning
          </Heading>
          <Paragraph marginBottom="spacing2Xl">
            Select the content type(s) you want to use with Rich Text Versioning. You can change
            this anytime by clicking 'Edit' on the rich text field type and adjust the Appearance
            settings in your content type.
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
          <Box>
            <Heading as="h3" marginBottom="spacingXs">
              Assign rich text fields
            </Heading>
            <Paragraph marginBottom="spacingL">
              Select the specific rich text fields you want to use with Rich Text Versioning. You
              can change this anytime by clicking 'Edit' on the rich text field type and adjust the
              Appearance settings in your content type.
            </Paragraph>
            {
              <FormControl id="richTextFields">
                <FormControl.Label>Rich text fields</FormControl.Label>
                <ContentTypeMultiSelect
                  availableFields={availableFields}
                  selectedFields={selectedFields}
                  onSelectionChange={setSelectedFields}
                  isDisabled={availableFields.length === 0}
                  isLoading={isLoading}
                />
                {availableFields.length === 0 && (
                  <Note variant="warning" className={styles.warningNote}>
                    There are no Rich Text field types to select to use with Rich Text Versioning.
                    Once you have added one to a content type, it will appear here.
                  </Note>
                )}
              </FormControl>
            }
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
