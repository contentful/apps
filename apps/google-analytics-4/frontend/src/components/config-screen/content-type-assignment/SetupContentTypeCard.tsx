import React, { useEffect, useState } from 'react'
import { Stack, Card, Flex, Paragraph, Box, TextLink, Button, FormControl, Table } from '@contentful/f36-components'
import {
  CheckCircleIcon,
  ExternalLinkTrimmedIcon,
} from '@contentful/f36-icons';
import MapContentTypeRow from 'components/config-screen/content-type-assignment/MapContentTypeRow';
import { ContentTypeProps, createClient } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey, ContentTypeMappingType } from 'types';

interface Props {
  onCancelContentType: React.MouseEventHandler<HTMLButtonElement>
  onSaveContentType: (_contentTypeMappings: ContentTypeMappingType[]) => void
}

export default function SetupContentTypeCard(props: Props) {
  const { onCancelContentType, onSaveContentType } = props;
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [contentTypeMappings, setContentTypeMappings] = useState<ContentTypeMappingType[]>([]);
  const [contentTypeMappingComponents, setContentTypeMappingComponents] = useState<JSX.Element[]>([]);

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

      // This will need to be re-factored
      setContentTypeMappings([]) // should be from saved set first
      const _contentTypeMappingComponents = []
      _contentTypeMappingComponents.push(<MapContentTypeRow contentTypes={_contentTypes.items} />)
      setContentTypeMappingComponents(_contentTypeMappingComponents) // should be from saved set first
    }

    getContentTypes();
  }, [sdk.ids.environment, sdk.ids.space])

  const handleSaveContentTypeMappings = () => {
    onSaveContentType([])
  }

  const handleAddContentTypeMapping = () => {
    contentTypeMappingComponents.push(<MapContentTypeRow contentTypes={contentTypes} />)
    setContentTypeMappingComponents([...contentTypeMappingComponents])
  }

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
          <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={handleSaveContentTypeMappings}>Save</TextLink>
        </Flex>
      </Flex>
      <Stack marginBottom='none' spacing="spacingS">
        <Box style={{ minWidth: '250px' }}>
          <FormControl>
            <FormControl.Label>Content Type</FormControl.Label>
          </FormControl>
        </Box>
        <Box style={{ minWidth: '250px' }}>
          <FormControl>
            <FormControl.Label>Field</FormControl.Label>
          </FormControl>
        </Box>
        <Box style={{ minWidth: '250px' }}>
          <FormControl>
            <FormControl.Label>Url Prefix</FormControl.Label>
          </FormControl>
        </Box>
      </Stack>
      {contentTypeMappingComponents}
      <Button onClick={handleAddContentTypeMapping}>Add Another Content Type</Button>
    </>
  )
}
