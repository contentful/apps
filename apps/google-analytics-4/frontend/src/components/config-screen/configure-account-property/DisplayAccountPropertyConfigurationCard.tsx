import React, { useEffect, useState } from 'react'
import { Flex, Paragraph, Box, TextLink, FormControl, Badge, Button, Spinner } from '@contentful/f36-components'
import { ServiceAccountKeyId, ServiceAccountKey, AccountSummariesType, PropertySummariesType } from 'types';

interface Props {
  onEditConfiguration: React.MouseEventHandler<HTMLButtonElement>
  selectedAccount: AccountSummariesType
  selectedProperty: PropertySummariesType
}

export default function DisplayAccountPropertyConfiguration(props: Props) {
  const { onEditConfiguration, selectedAccount, selectedProperty } = props;
  const [isLoading, setIsLoading] = useState(true);

  const handleTestConfiguration = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }

  useEffect(() => {
    handleTestConfiguration();
  }, []);

  return (
    <>
      <Flex justifyContent="space-between" marginBottom='none' marginTop='spacingXs'>
        <Paragraph marginBottom='none'><b>Google Analytics Configuration</b></Paragraph>
        <Flex justifyContent="space-between" marginBottom='spacingL'>
          <Box paddingRight='spacingXs' paddingTop='spacingXs'>
            <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onEditConfiguration}>Edit</TextLink>
          </Box>
          <Box style={{ minWidth: '60px', minHeight: '30px' }}>
            {isLoading ?
              <Spinner variant="default" /> :
              <Button variant="primary" size="small" onClick={handleTestConfiguration}>Test</Button>
            }
          </Box>
        </Flex>
      </Flex>
      <FormControl>
        <FormControl.Label marginBottom="none">Current Account</FormControl.Label>
        <Paragraph>
          <Box as='code'>{selectedAccount.displayName}</Box>
        </Paragraph>
      </FormControl>
      <FormControl>
        <FormControl.Label marginBottom="none">Current Property</FormControl.Label>
        <Paragraph>
          <Box as='code'>{selectedProperty.displayName}</Box>
        </Paragraph>
      </FormControl>
      {/* TODO: Have error handling like in the Installed Google Service Account Badge/Card */}
      <FormControl marginBottom="none">
        <FormControl.Label marginBottom="none">Status</FormControl.Label>
        <Paragraph>
          <Badge variant="positive">active</Badge>
        </Paragraph>
      </FormControl>
    </>
  )
}
