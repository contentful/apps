import React, { useState, useEffect } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK, CollectionResponse } from '@contentful/app-sdk';
import { Stack, Box, Subheading, Paragraph, Card, FormControl, Select } from '@contentful/f36-components'
import { ContentFields, ContentTypeProps, KeyValueMap } from 'contentful-management';
import SimpleDropdown from 'components/common/SimpleDropdown';
import { createClient } from 'contentful-management'

interface Props {
  accountsSummaries: any[],
  isInEditMode: boolean,
}

export default function ConfigurationPage(props: Props) {
  const { accountsSummaries, isInEditMode } = props;
  const [properties, setProperties] = useState<any[]>([]);

  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>('');
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeName, setSelectedContentTypeName] = useState<string>('');
  const [slug, setSlug] = useState<any>();

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
      const _contentTypes = await environment.getContentTypes();
      setContentTypes(_contentTypes.items);
    }

    getContentTypes();
  }, [isInEditMode, sdk.ids.environment, sdk.ids.space])

  useEffect(() => {
    const updatePropertiesList = () => {
      const selectedAccount = accountsSummaries.find(accountSummary => accountSummary.account === selectedAccountName)
      setProperties(selectedAccount.propertySummaries)
    }

    if (selectedAccountName) updatePropertiesList();
  }, [isInEditMode, accountsSummaries, selectedAccountName])

  const handleAccountSelection = (event: any) => {
    setSelectedAccountName(event.target.value);
    setSelectedPropertyName('')
    setSelectedContentTypeName('')
  }

  const handlePropertySelection = (event: any) => {
    setSelectedPropertyName(event.target.value);
    setSelectedContentTypeName('')
  }

  const handleContentTypeSelection = (event: any) => {
    setSelectedContentTypeName(event.target.value)

    const _selectedContentType = contentTypes.find(contentType => contentType.name === event.target.value);
    const _fields = _selectedContentType?.fields

    if (!_fields || _fields.length === 0) console.error("No maching field found")

    const slug = _fields?.find(field => field.id === 'slug')
    if (!slug) console.error("No slug fields")

    console.log(slug)
    setSlug(slug)
  }

  const renderSdkDialog = (): string => {
    console.log(selectedContentTypeName.toLocaleLowerCase())
    const dialog = sdk.dialogs.selectSingleEntry({
      contentTypes: [selectedContentTypeName.toLocaleLowerCase()],
    }).then((selectedEntry) => { });

    if (!dialog) return ""
    return "Dialog Completed?"
  }

  // const handleFieldSelection = (event: any) => {
  //   console.log(event)
  // }

  // useEffect(() => {
  //   setContentFields(selectedContentType.fields)
  // }, [selectedContentType])

  return (
    <Stack spacing='spacingL' marginBottom='none' flexDirection='column' alignItems='flex-start'>
      <Box>
        <Subheading>Configuration</Subheading>
        <Paragraph marginBottom='none'>Configure your Google Analytics app installation.</Paragraph>
      </Box>

      <Card>
        <SimpleDropdown selectId='accountSelect' formTitle='Account Selection' helpText='Please select an account' onSelectionChange={handleAccountSelection}>
          {accountsSummaries.map((accountsSummary) => {
            return (<Select.Option value={accountsSummary.account}>{`${accountsSummary.displayName} (${accountsSummary.account})`}</Select.Option>)
          })}
        </SimpleDropdown>
        <SimpleDropdown selectId='propertySelect' formTitle='Property Selection' helpText='Please select a property' isDisabled={!selectedAccountName} onSelectionChange={handlePropertySelection}>
          {properties.map((property) => {
            return (<Select.Option value={property.property}>{`${property.displayName} (${property.property})`}</Select.Option>)
          })}
        </SimpleDropdown>
        <SimpleDropdown selectId='contentTypeSelect' formTitle='Content Type Selection' helpText='Please select a content type' isDisabled={!selectedPropertyName} onSelectionChange={handleContentTypeSelection}>
          {contentTypes.map((contentType) => {
            return (<Select.Option value={contentType.name}>{`${contentType.name}`}</Select.Option>)
          })}
        </SimpleDropdown>
      </Card>

      {/* Remove??? */}
      {/* <Box>
        {slug && renderSdkDialog()}
      </Box> */}
    </Stack>
  )
}
