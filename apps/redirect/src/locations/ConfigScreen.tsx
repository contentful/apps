import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  Subheading,
  FormControl,
  Switch,
  Box,
  Note,
} from '@contentful/f36-components';
import { ArrowRightIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { AppInstallationParameters } from '../utils/types';
import tokens from '@contentful/f36-tokens';
import {
  createContentTypes as createConfigurationContentTypes,
  REDIRECT_CONTENT_TYPE_ID,
  VANITY_URL_CONTENT_TYPE_ID,
} from '../utils/createContentType';
import { styles } from './ConfigScreen.styles';

const EXCLUDED_CONTENT_TYPE_IDS: string[] = [REDIRECT_CONTENT_TYPE_ID, VANITY_URL_CONTENT_TYPE_ID];

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    enableVanityUrl: false,
    redirectFromContentTypes: [],
    redirectToContentTypes: [],
  });
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);

  const onConfigure = useCallback(async () => {
    const hasFromError = parameters.redirectFromContentTypes.length === 0;
    const hasToError = parameters.redirectToContentTypes.length === 0;

    if (hasFromError || hasToError) {
      setShowValidationErrors(true);
      return false;
    }

    try {
      await createConfigurationContentTypes(sdk, parameters.enableVanityUrl);
    } catch {
      sdk.notifier.error('Failed to create required content types. Please try again.');

      return false;
    }

    const allContentTypeIds = new Set([
      ...parameters.redirectFromContentTypes.map((ct) => ct.id),
      ...parameters.redirectToContentTypes.map((ct) => ct.id),
    ]);

    const editorInterface = Array.from(allContentTypeIds).reduce(
      (acc, contentTypeId) => ({
        ...acc,
        [contentTypeId]: {
          sidebar: { position: 0 },
        },
      }),
      {}
    );

    setShowValidationErrors(false);
    return {
      parameters,
      targetState: {
        EditorInterface: editorInterface,
      },
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex justifyContent="center" margin="spacingXl">
      <Flex flexDirection="column" className={styles.body}>
        <Form>
          <Box marginBottom="spacing2Xl">
            <Heading as="h2" marginBottom="spacingS" fontWeight="fontWeightMedium">
              Set up Redirects
            </Heading>
            <Paragraph>
              The Redirects app provides a simple, marketer-friendly way to create, manage, and
              track redirects directly inside Contentful, no custom modeling or developer help
              required.
            </Paragraph>
          </Box>
          <Box marginBottom="spacingXl">
            <Heading as="h3" marginBottom="spacingL">
              Configure
            </Heading>
            <Flex flexDirection="row" alignItems="flex-start" gap="spacingL">
              {/* Redirect FROM */}
              <Box flex="1">
                <Subheading as="h4" marginBottom="spacingXs">
                  Redirect FROM
                </Subheading>
                <Paragraph marginBottom="spacingS">
                  Select content types that should be able to redirect visitors to other pages.
                </Paragraph>
                <FormControl
                  isRequired
                  isInvalid={
                    showValidationErrors && parameters.redirectFromContentTypes.length === 0
                  }>
                  <FormControl.Label>Select redirect from content types</FormControl.Label>
                  <ContentTypeMultiSelect
                    selectedContentTypes={parameters.redirectFromContentTypes}
                    setSelectedContentTypes={(contentTypes) =>
                      setParameters((prev) => ({ ...prev, redirectFromContentTypes: contentTypes }))
                    }
                    cma={sdk.cma}
                    excludedContentTypesIds={EXCLUDED_CONTENT_TYPE_IDS}
                  />
                  {showValidationErrors && parameters.redirectFromContentTypes.length === 0 && (
                    <FormControl.ValidationMessage>
                      Select at least one content type
                    </FormControl.ValidationMessage>
                  )}
                </FormControl>
              </Box>

              <Box marginTop="spacingXl">
                <ArrowRightIcon variant="muted" />
              </Box>

              <Box flex="1">
                <Subheading as="h4" marginBottom="spacingXs">
                  Redirect TO
                </Subheading>
                <Paragraph marginBottom="spacingS">
                  Select content types that redirects point to (typically the same as redirect
                  sources).
                </Paragraph>
                <FormControl
                  isRequired
                  isInvalid={
                    showValidationErrors && parameters.redirectToContentTypes.length === 0
                  }>
                  <FormControl.Label>Select redirect to content types</FormControl.Label>
                  <ContentTypeMultiSelect
                    selectedContentTypes={parameters.redirectToContentTypes}
                    setSelectedContentTypes={(contentTypes) =>
                      setParameters((prev) => ({ ...prev, redirectToContentTypes: contentTypes }))
                    }
                    cma={sdk.cma}
                    excludedContentTypesIds={EXCLUDED_CONTENT_TYPE_IDS}
                  />
                  {showValidationErrors && parameters.redirectToContentTypes.length === 0 && (
                    <FormControl.ValidationMessage>
                      Select at least one content type
                    </FormControl.ValidationMessage>
                  )}
                </FormControl>
              </Box>
            </Flex>
          </Box>

          <Box marginBottom="spacing2Xl">
            <Subheading marginBottom="spacingXs">Vanity URL</Subheading>
            <Paragraph marginBottom="spacingS">
              Create a dedicated content type for marketing campaign URLs and branded shortcuts
              (e.g., /demo, /signup, /webinar).
            </Paragraph>
            <Switch
              isChecked={parameters.enableVanityUrl}
              onChange={() =>
                setParameters({ ...parameters, enableVanityUrl: !parameters.enableVanityUrl })
              }
              style={{ fontWeight: tokens.fontWeightNormal }}>
              Enable Vanity URL content type
            </Switch>
          </Box>

          <Box marginBottom="spacing3Xl">
            <Subheading marginBottom="spacingXs">Disclaimer</Subheading>
            <Note variant="warning" className={styles.noteIconTop}>
              <Paragraph marginBottom={parameters.enableVanityUrl ? 'spacingM' : 'none'}>
                The Redirects app creates a content type called &quot;Redirect.&quot; This content
                type is required for the app to function, if it is deleted, redirects will no longer
                work. Each redirect you create generates a new entry using this content type;
                deleting an entry will disable the corresponding redirect.
              </Paragraph>
              {parameters.enableVanityUrl && (
                <Paragraph marginBottom="none">
                  If you use vanity URLs, the app also creates a content type called &quot;Vanity
                  URL.&quot; This content type is required for vanity URLs to function. Each vanity
                  URL you create generates a new entry using this content type; deleting an entry
                  will disable the corresponding vanity URL.
                </Paragraph>
              )}
            </Note>
          </Box>
        </Form>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
