import React, { useState, useEffect } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK, CollectionResponse } from '@contentful/app-sdk';
import { Stack, Box, Subheading, Paragraph, Card, FormControl, Select, Button, MenuItem, IconButton, Menu, Flex, TextLink, Badge } from '@contentful/f36-components'
import { MenuIcon, CycleIcon, CheckCircleIcon, ArrowForwardTrimmedIcon } from '@contentful/f36-icons';
import { Collection, ContentFields, ContentTypeProps, KeyValueMap, LocaleProps } from 'contentful-management';
import SimpleDropdown from 'components/common/SimpleDropdown';
import { createClient } from 'contentful-management'
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  accountsSummaries: any[],
  isInEditMode: boolean,
  serviceAccountKeyId: ServiceAccountKeyId,
  serviceAccountKey: ServiceAccountKey,
}

export default function ConfigurationPage(props: Props) {
  const { accountsSummaries, isInEditMode, serviceAccountKeyId, serviceAccountKey } = props;
  const [properties, setProperties] = useState<any[]>([]);

  const [selectedAccount, setSelectedAccount] = useState<any>();
  const [selectedProperty, setSelectedProperty] = useState<any>();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  const [fields, setFields] = useState<ContentFields<KeyValueMap>[]>([]);
  const [selectedField, setSelectedFields] = useState<string>('');
  const [defaultEnvLocal, setDefaultEnvLocal] = useState<string>('');
  const [slug, setSlug] = useState<any>();
  const [isInEditConfigurationMode, setIsInEditConfigurationMode] = useState<boolean>(false);

  const api = useApi(serviceAccountKeyId, serviceAccountKey);
  // const [contentFields, setContentFields] = useState<ContentFields<KeyValueMap>[]>([]);
  // const [selectedContentField, setSelectedContentField] = useState<ContentFields<KeyValueMap>>();

  const sdk = useSDK<AppExtensionSDK>();

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

  // const openSdkDialog = (): string => {
  //   console.log(selectedContentTypeId)
  //   const dialog = sdk.dialogs.selectSingleEntry({
  //     contentTypes: [selectedContentTypeId],
  //   }).then(async (selectedEntry: any) => {
  //     const fetchedAccountSummaries = await api.getPageData();
  //     console.log('Account summaries: ', accountsSummaries)
  //     console.log('Page Data: ', fetchedAccountSummaries)
  //     console.log('selectedField', selectedField)
  //     console.log('defaultEnvLocal', defaultEnvLocal)
  //     console.log('selectedEntry', selectedEntry)
  //     console.log(selectedEntry.fields[selectedField][defaultEnvLocal]) // value from that field on a specific entry record
  //   });

  //   if (!dialog) return ""
  //   return "Dialog Completed?"
  // }
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
        {/* <SimpleDropdown selectId='contentTypeSelect' formTitle='Content Type Selection' helpText='Please select a content type' isDisabled={false} onSelectionChange={handleContentTypeSelection}>
          {contentTypes.map((contentType) => {
            return (<Select.Option value={contentType.sys.id}>{`${contentType.name}`}</Select.Option>)
          })}
        </SimpleDropdown>

        <SimpleDropdown selectId='fieldSelect' formTitle='Field Selection' helpText='Please select a field' isDisabled={!selectedContentTypeId} onSelectionChange={handleFieldSelection}>
          {fields.map((field) => {
            return (<Select.Option value={field.id}>{`${field.name}`}</Select.Option>)
          })}
        </SimpleDropdown> */}
      </Card>

      {/* Remove??? */}
      {/* <Button onClick={openSdkDialog} isDisabled={!selectedField}>Select Entry</Button> */}
    </Stack>
  )
}
