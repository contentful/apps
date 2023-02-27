import React, { useState, useEffect } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK, CollectionResponse } from '@contentful/app-sdk';
import { Stack, Box, Subheading, Paragraph, Card, FormControl, Select, Button } from '@contentful/f36-components'
import { Collection, ContentFields, ContentTypeProps, KeyValueMap, LocaleProps } from 'contentful-management';
import SimpleDropdown from 'components/common/SimpleDropdown';
import { createClient } from 'contentful-management'
import { useApi } from 'hooks/useApi';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  accountsSummaries: any[],
  isInEditMode: boolean,
  serviceAccountKeyId:  ServiceAccountKeyId,
  serviceAccountKey: ServiceAccountKey,
}

export default function ConfigurationPage(props: Props) {
  const { accountsSummaries, isInEditMode, serviceAccountKeyId, serviceAccountKey } = props;
  const [properties, setProperties] = useState<any[]>([]);

  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>('');
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  const [fields, setFields] = useState<ContentFields<KeyValueMap>[]>([]);
  const [selectedField, setSelectedFields] = useState<string>('');
  const [defaultEnvLocal, setDefaultEnvLocal] = useState<string>('');
  const [slug, setSlug] = useState<any>();

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
    setSelectedContentTypeId('')
  }

  const handlePropertySelection = (event: any) => {
    setSelectedPropertyName(event.target.value);
    setSelectedContentTypeId('')
  }

  const handleContentTypeSelection = (event: any) => {
    setSelectedContentTypeId(event.target.value)
    setSelectedFields('')

    const _selectedContentType = contentTypes.find(contentType => contentType.sys.id === event.target.value);
    const _fields = _selectedContentType?.fields

    if (!_fields || _fields.length === 0) console.error("No maching field found")

    setFields(_fields ?? []);
    console.log(_fields)
    const slug = _fields?.find(field => field.id === 'slug')
    if (!slug) console.error("No slug fields")

    console.log(slug)
    setSlug(slug)
  }

  const handleFieldSelection = (event: any) => {
    setSelectedFields(event.target.value);
  }

  const openSdkDialog = (): string => {
    console.log(selectedContentTypeId)
    const dialog = sdk.dialogs.selectSingleEntry({
      contentTypes: [selectedContentTypeId],
    }).then(async (selectedEntry: any) => {
      const fetchedAccountSummaries = await api.getPageData();
      console.log('Page Data: ', fetchedAccountSummaries)
      console.log('selectedField', selectedField)
      console.log('defaultEnvLocal', defaultEnvLocal)
      console.log('selectedEntry', selectedEntry)
      console.log(selectedEntry.fields[selectedField][defaultEnvLocal]) // value from that field on a specific entry record
    });

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
        <SimpleDropdown selectId='contentTypeSelect' formTitle='Content Type Selection' helpText='Please select a content type' isDisabled={false} onSelectionChange={handleContentTypeSelection}>
          {contentTypes.map((contentType) => {
            return (<Select.Option value={contentType.sys.id}>{`${contentType.name}`}</Select.Option>)
          })}
        </SimpleDropdown>

        <SimpleDropdown selectId='fieldSelect' formTitle='Field Selection' helpText='Please select a field' isDisabled={!selectedContentTypeId} onSelectionChange={handleFieldSelection}>
          {fields.map((field) => {
            return (<Select.Option value={field.id}>{`${field.name}`}</Select.Option>)
          })}
        </SimpleDropdown>
      </Card>

      {/* Remove??? */}
      <Button onClick={openSdkDialog} isDisabled={!selectedField}>Select Entry</Button>
    </Stack>
  )
}
