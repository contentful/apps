import React, { useEffect, useState } from 'react'
import { Stack, Box, Subheading, Paragraph, Select, Card } from '@contentful/f36-components'
import SimpleDropdown from 'components/common/SimpleDropdown'
import { ContentFields, ContentTypeProps, createClient, KeyValueMap } from 'contentful-management';
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey, ContentTypeMappingType } from 'types';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import MapContentTypeRow from 'components/config-screen/content-type-assignment/MapContentTypeRow';
import useKeyService from 'hooks/useKeyService';
import SetupContentTypeCard from 'components/config-screen/content-type-assignment/SetupContentTypeCard';
import DisplayContentTypeCard from 'components/config-screen/content-type-assignment/DisplayContentTypeCard';

interface Props {
}

export default function AssignContentTypePage(props: Props) {
  const [isInEditContentTypeMode, setIsInEditContentTypeMode] = useState<boolean>(false);
  const [contentTypeMappings, setContentTypeMappings] = useState<ContentTypeMappingType[]>([]);

  const { parameters } = useKeyService();
  console.log(parameters)

  const handleEditContentType = () => {
    setIsInEditContentTypeMode(true)
  }

  const handleTestContentType = () => {
  }

  const handleCancelContentType = () => {
    setIsInEditContentTypeMode(false)
  }

  // Save to local storage? and then eventually some RDS db?
  const handleSaveContentType = (_contentTypeMappings: ContentTypeMappingType[]) => {
    setContentTypeMappings(_contentTypeMappings)
    setIsInEditContentTypeMode(false)
  }

  return (
    <Stack spacing='spacingL' marginBottom='none' flexDirection='column' alignItems='flex-start'>
      <Box>
        <Subheading>Assign Content Type</Subheading>
        <Paragraph marginBottom='none'>Select which content types will show the Google Analytics functionality in the sidebar. Specify the slug field that is used for URL generation in your application. Optionally, specify a prefix for the slug.</Paragraph>
      </Box>
      {parameters && parameters.serviceAccountKeyId && parameters.serviceAccountKey &&
        <Card>
          {isInEditContentTypeMode ?
            <SetupContentTypeCard
              onCancelContentType={handleCancelContentType}
              onSaveContentType={handleSaveContentType}
            />
            :
            <DisplayContentTypeCard
              onEditContentType={handleEditContentType}
              serviceAccountKeyId={parameters.serviceAccountKeyId}
              serviceAccountKey={parameters.serviceAccountKey}
            />
          }
        </Card>
      }
    </Stack>
  )
}
