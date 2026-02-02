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
} from '@contentful/f36-components';
import { ArrowRightIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useCallback, useEffect, useState } from 'react';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { AppInstallationParameters, ContentType } from '../utils/types';
import tokens from '@contentful/f36-tokens';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    enableVanityUrl: true,
  });
  const [redirectFromContentTypes, setRedirectFromContentTypes] = useState<ContentType[]>([]);
  const [redirectToContentTypes, setRedirectToContentTypes] = useState<ContentType[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);

  const onConfigure = useCallback(async () => {
    const hasFromError = redirectFromContentTypes.length === 0;
    const hasToError = redirectToContentTypes.length === 0;

    if (hasFromError || hasToError) {
      setShowValidationErrors(true);
      return false;
    }

    setShowValidationErrors(false);
    return {
      parameters,
    };
  }, [parameters, redirectFromContentTypes, redirectToContentTypes, sdk]);

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
      <Flex flexDirection="column" className={css({ maxWidth: '800px', width: '100%' })}>
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

          {/* Configure Section */}
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
                  isInvalid={showValidationErrors && redirectFromContentTypes.length === 0}>
                  <FormControl.Label>Select redirect from content types</FormControl.Label>
                  <ContentTypeMultiSelect
                    selectedContentTypes={redirectFromContentTypes}
                    setSelectedContentTypes={setRedirectFromContentTypes}
                    sdk={sdk}
                    cma={sdk.cma}
                  />
                  {showValidationErrors && redirectFromContentTypes.length === 0 && (
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
                  isInvalid={showValidationErrors && redirectToContentTypes.length === 0}>
                  <FormControl.Label>Select redirect to content types</FormControl.Label>
                  <ContentTypeMultiSelect
                    selectedContentTypes={redirectToContentTypes}
                    setSelectedContentTypes={setRedirectToContentTypes}
                    sdk={sdk}
                    cma={sdk.cma}
                  />
                  {showValidationErrors && redirectToContentTypes.length === 0 && (
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

          <Box>
            <Subheading marginBottom="spacingXs">Disclaimer</Subheading>
            <Paragraph>
              The Redirects app will create a content type labeled &quot;Redirect&quot;. If deleted,
              the app will not work.
            </Paragraph>
          </Box>
        </Form>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
