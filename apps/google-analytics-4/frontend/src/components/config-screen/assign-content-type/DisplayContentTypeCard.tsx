import React from 'react'
import { Stack, Card, Flex, Paragraph, Box, TextLink, FormControl, Button } from '@contentful/f36-components'
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  onEditContentType: React.MouseEventHandler<HTMLButtonElement>
  onTestContentType: React.MouseEventHandler<HTMLButtonElement>
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
}

export default function DisplayContentTypeCard(props: Props) {
  const { onEditContentType, onTestContentType, serviceAccountKeyId, serviceAccountKey } = props;

  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  const fetchGAData = async () => {
    const fetchedGAJson = await api.getPageData();
    console.log(fetchedGAJson)
  }

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Box paddingBottom='spacingL'>
          <Paragraph marginBottom='none'><b>Content Type Mappings</b></Paragraph>
        </Box>
        <Flex justifyContent="space-between" marginBottom='spacingL'>
          <Box paddingRight='spacingXs'>
            <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onEditContentType}>Edit</TextLink>
          </Box>
          <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onTestContentType}>Test</TextLink>
        </Flex>
      </Flex>
      <Paragraph marginBottom='spacingXs'>Select your new {<b>Account to Property</b>} mapping and save your changes</Paragraph>
    </>
  )
}
