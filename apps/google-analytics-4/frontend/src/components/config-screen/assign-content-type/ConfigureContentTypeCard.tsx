import React, { useEffect, useState } from 'react'
import { Stack, Card, Flex, Paragraph, Box, TextLink, Button } from '@contentful/f36-components'
import {
  CheckCircleIcon,
  ExternalLinkTrimmedIcon,
} from '@contentful/f36-icons';
import ContentTypeOptionRow from 'components/config-screen/assign-content-type/ContentTypeOptionRow';
import { ContentTypeProps, createClient } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  onCancelContentType: React.MouseEventHandler<HTMLButtonElement>
  onSaveContentType: React.MouseEventHandler<HTMLButtonElement>
}

export default function ConfigureContentTypeCard(props: Props) {
  const { onCancelContentType, onSaveContentType } = props;
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [defaultEnvLocal, setDefaultEnvLocal] = useState<string>(''); // probably not needed

  const sdk = useSDK<AppExtensionSDK>();
  const cma = createClient({ apiAdapter: sdk.cmaAdapter })

  useEffect(() => {
    const getContentTypes = async () => {
      // Check if this has the 100 item limit
      const space = await cma.getSpace(sdk.ids.space);
      const environment = await space.getEnvironment(sdk.ids.environment)
      const locales = await environment.getLocales()
      const defaultLocale = locales.items.find(l => l.default)
      if (defaultLocale) setDefaultEnvLocal(defaultLocale.code);
      const _contentTypes = await environment.getContentTypes();
      console.log(_contentTypes)
      setContentTypes(_contentTypes.items);
    }

    getContentTypes();
  }, [sdk.ids.environment, sdk.ids.space])

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Box paddingBottom='spacingL'>
          <Paragraph marginBottom='none'><b>Edit Content Type Mapping</b></Paragraph>
        </Box>
        <Flex justifyContent="space-between" marginBottom='spacingL'>
          <Box paddingRight='spacingXs'>
            <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onCancelContentType}>Cancel</TextLink>
          </Box>
          <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onSaveContentType}>Save</TextLink>
        </Flex>
      </Flex>
      <ContentTypeOptionRow contentTypes={contentTypes} />
      <Button>Add Another Content Type</Button>
    </>
  )
}
