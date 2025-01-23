import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Stack, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect } from 'react';
import { generateInvocationParameters } from '../utils';

const ContentTypeActions = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const {
    ids: { space, environment },
    hostnames: { webapp },
    contentType: {
      name,
      sys: { id },
      fields,
      displayField,
    },
    // This is where the installation parameters are accessed
    parameters: { installation: installationParams },
  } = sdk;

  const handleFieldDetailsClick = useCallback(async () => {
    sdk.dialogs.openCurrentApp({
      position: 'center',
      width: 'large',
      allowHeightOverflow: true,
      title: `${name} Field Details`,
      // This is where invocation parameters are passed to the dialog
      parameters: {
        fieldDetails: generateInvocationParameters(fields, displayField),
      },
    });
  }, [sdk]);

  const useGetContentTypeConfigLink = useCallback(() => {
    const link =
      environment === 'master'
        ? `https://${webapp}/spaces/${space}/content_types/${id}/fields`
        : `https://${webapp}/spaces/${space}/environments/${environment}/content_types/${id}/fields`;
    return link;
  }, [sdk.ids]);

  return (
    <Stack flexDirection="column" spacing="spacingS">
      {/* Display the Field Details button if the installation parameter is enabled */}
      {installationParams.displayFieldDetails && (
        <Button variant="secondary" onClick={handleFieldDetailsClick} isFullWidth>
          View Field Details
        </Button>
      )}
      {/* Display the Edit Link if the installation parameter is enabled */}
      {installationParams.displayEditLink && (
        <TextLink
          href={useGetContentTypeConfigLink()}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExternalLinkIcon />}
          alignIcon="end">
          Edit Content Type
        </TextLink>
      )}
    </Stack>
  );
};

export default ContentTypeActions;
