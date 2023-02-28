import React, { useEffect, useState } from 'react'
import { Stack, Card, Flex, Paragraph, Box, TextLink, FormControl, Button, Spinner } from '@contentful/f36-components'
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  onEditContentType: React.MouseEventHandler<HTMLButtonElement>
  serviceAccountKeyId: ServiceAccountKeyId;
  serviceAccountKey: ServiceAccountKey;
}

export default function DisplayContentTypeCard(props: Props) {
  const { onEditContentType, serviceAccountKeyId, serviceAccountKey } = props;

  const [isLoading, setIsLoading] = useState(true);

  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  const fetchGAData = async () => {
    const fetchedGAJson = await api.getPageData();
    console.log(fetchedGAJson)
  }

  const handleTestContentType = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }

  useEffect(() => {
    handleTestContentType();
  }, []);

  return (
    <>
      <Flex justifyContent="space-between" marginBottom='none'>
        <Paragraph marginBottom='none'><b>Content Type Mappings</b></Paragraph>
        <Flex justifyContent="space-between" marginBottom='spacingL'>
          <Box paddingRight='spacingXs' paddingTop='spacingXs'>
            <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onEditContentType}>Edit</TextLink>
          </Box>
          <Box style={{ minWidth: '60px', minHeight: '30px' }}>
            {isLoading ?
              <Spinner variant="default" /> :
              <Button variant="primary" size="small" onClick={handleTestContentType}>Test</Button>
            }
          </Box>
        </Flex>
      </Flex>
      <Paragraph marginBottom='spacingXs'>Select your new {<b>Account to Property</b>} mapping and save your changes</Paragraph>
    </>
  )
}
