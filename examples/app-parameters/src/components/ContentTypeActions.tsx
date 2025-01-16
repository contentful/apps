import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Stack, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Control } from 'contentful-management';
import { useCallback, useEffect, useState } from 'react';
import { generateInvocationParameters } from '../utils';

const ContentTypeActions = () => {
  const [editorInterfaceControls, setEditorInterfaceControls] = useState<Control[]>([]);
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
    parameters: { installation: installationParams },
  } = sdk;
  const cma = sdk.cma;

  useEffect(() => {
    const getEditorInterface = async () => {
      const editorInterface = await cma.editorInterface.get({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: sdk.contentType.sys.id,
      });
      if (editorInterface.controls) setEditorInterfaceControls(editorInterface.controls);
    };
    getEditorInterface();
  }, [sdk]);

  const handleFieldDetailsClick = useCallback(async () => {
    sdk.dialogs.openCurrentApp({
      position: 'center',
      width: 'large',
      allowHeightOverflow: true,
      title: `${name} Field Details`,
      parameters: {
        fieldDetails: generateInvocationParameters(fields, editorInterfaceControls, displayField),
      },
    });
  }, [sdk, editorInterfaceControls]);

  const useGetContentTypeConfigLink = useCallback(() => {
    const link =
      environment === 'master'
        ? `https://${webapp}/spaces/${space}/content_types/${id}/fields`
        : `https://${webapp}/spaces/${space}/environments/${environment}/content_types/${id}/fields`;
    return link;
  }, [sdk.ids]);

  return (
    <Stack flexDirection="column" spacing="spacingS">
      {installationParams.displayFieldDetails && (
        <Button variant="secondary" onClick={handleFieldDetailsClick} isFullWidth>
          View Field Details
        </Button>
      )}
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
