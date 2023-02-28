import React, { useState, useEffect } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK, CollectionResponse } from '@contentful/app-sdk';
import { Stack, Box, Subheading, Paragraph, Card, FormControl, Select, Button, MenuItem, IconButton, Menu, Flex, TextLink, Badge } from '@contentful/f36-components'
import { MenuIcon, CycleIcon, CheckCircleIcon, ArrowForwardTrimmedIcon } from '@contentful/f36-icons';
import { Collection, ContentFields, ContentTypeProps, KeyValueMap, LocaleProps } from 'contentful-management';
import SimpleDropdown from 'components/common/SimpleDropdown';
import { createClient } from 'contentful-management'

interface Props {
  accountsSummaries: any[],
  isInEditMode: boolean,
}

export default function ConfigurationPage(props: Props) {
  const { accountsSummaries, isInEditMode } = props;

  const [selectedAccount, setSelectedAccount] = useState<any>();
  const [selectedProperty, setSelectedProperty] = useState<any>();

  const [isInEditConfigurationMode, setIsInEditConfigurationMode] = useState<boolean>(false);

  const handlePropertySelection = (event: any) => {
    const _selectedProperty = JSON.parse(event.target.value);
    const _selectedAccountId = _selectedProperty.parent;
    const _selectedAccount = accountsSummaries.find(e => e.account === _selectedAccountId);
    setSelectedAccount(_selectedAccount)
    setSelectedProperty(_selectedProperty);
    setIsInEditConfigurationMode(true);
  }

  const handleEditConfigurationButton = () => {
    setIsInEditConfigurationMode(true)
  }

  const handleCancelConfigurationButton = () => {
    setIsInEditConfigurationMode(false)
  }

  const handleSaveConfigurationButton = () => {
    setIsInEditConfigurationMode(false)
  }

  console.log(accountsSummaries)


  return (
    <Stack spacing='spacingL' marginBottom='none' flexDirection='column' alignItems='flex-start'>
      <Box>
        <Subheading>Configuration</Subheading>
        <Paragraph marginBottom='none'>Configure your Google Analytics app installation.</Paragraph>
      </Box>

      <Card>
        {isInEditConfigurationMode || (!selectedAccount && !selectedProperty) ?
          <>
            <Flex alignItems="center" justifyContent="space-between">
              <Paragraph marginBottom='none'><b >Google Analytics Configuration</b></Paragraph>
              <Flex justifyContent="space-between" marginBottom='spacingL'>
                <Box paddingRight='spacingXs'>
                  <TextLink testId='cancelConfigurationButton' as="button" variant='primary' onClick={handleCancelConfigurationButton}>Cancel</TextLink>
                </Box>
                <TextLink testId='saveConfigurationButton' as="button" variant='primary' onClick={handleSaveConfigurationButton}>Save</TextLink>
              </Flex>
            </Flex>
            <Paragraph marginBottom='spacingXs'>Select your new {<b>Account to Property</b>} mapping and save your changes</Paragraph>
            <Menu>
              <Menu.Trigger>
                <Button isFullWidth>{selectedProperty ? (
                  <Flex>
                    {selectedAccount.displayName}<ArrowForwardTrimmedIcon marginLeft="spacingXs" marginRight="spacingXs" />{selectedProperty.displayName}
                  </Flex>
                )
                  :
                  'Select a property'}
                </Button>
              </Menu.Trigger>
              <Menu.List>
                {accountsSummaries.filter(accountSummary => accountSummary.propertySummaries.length > 0).map((accountsSummary) => {
                  return (
                    <Menu.Submenu key={accountsSummary.account}>
                      <Menu.SubmenuTrigger>{`${accountsSummary.displayName} (${accountsSummary.account})`}</Menu.SubmenuTrigger>
                      <Menu.List>
                        {accountsSummary.propertySummaries.map((property: any) => <Menu.Item key={property.property} value={JSON.stringify(property)} onClick={handlePropertySelection}>{property.displayName}</Menu.Item>)}
                      </Menu.List>
                    </Menu.Submenu>
                  )
                })}
              </Menu.List>
            </Menu>
          </>
          :
          <>
            <Flex justifyContent="space-between" marginBottom='spacingS'>
              <Paragraph marginBottom='none'><b>Google Analytics Configuration</b></Paragraph>
              <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={handleEditConfigurationButton}>Edit</TextLink>
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
        }
      </Card>
    </Stack>
  )
}
