import React, { useEffect, useState } from 'react'
import { Stack, Box, Subheading, Paragraph, Select } from '@contentful/f36-components'
import SimpleDropdown from 'components/common/SimpleDropdown'
import { ContentFields, ContentTypeProps, createClient, KeyValueMap } from 'contentful-management';
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeOptionRow from 'components/config-screen/assign-content-type/ContentTypeOptionRow';

interface Props {
  isInEditMode: boolean,
  serviceAccountKeyId: ServiceAccountKeyId,
  serviceAccountKey: ServiceAccountKey,
}

export default function AssignContentTypePage(props: Props) {
  const { isInEditMode, serviceAccountKeyId, serviceAccountKey } = props;

  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [defaultEnvLocal, setDefaultEnvLocal] = useState<string>('');

  const sdk = useSDK<AppExtensionSDK>();
  const api = useApi(serviceAccountKeyId, serviceAccountKey);
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
  )

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
  }, [isInEditMode, sdk.ids.environment, sdk.ids.space])



  const fetchGAData = async () => {
    const fetchedGAJson = await api.getPageData();
    console.log(fetchedGAJson)
  }

  return (
    <Stack spacing='spacingL' marginBottom='none' flexDirection='column' alignItems='flex-start'>
      <Box>
        <Subheading>Assign Content Type</Subheading>
        <Paragraph marginBottom='none'>Select which content types will show the Google Analytics functionality in the sidebar. Specify the slug field that is used for URL generation in your application. Optionally, specify a prefix for the slug.</Paragraph>
      </Box>
      <ContentTypeOptionRow contentTypes={contentTypes} isSavedRow={false} />
    </Stack>
  )
}
