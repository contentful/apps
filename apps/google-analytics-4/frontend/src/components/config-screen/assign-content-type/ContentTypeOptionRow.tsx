import React, { useState } from 'react'
import { Box, Button, Flex, FormControl, Select, Stack, TextInput } from '@contentful/f36-components'
import SimpleDropdown from 'components/common/SimpleDropdown'
import { ContentFields, ContentTypeProps, KeyValueMap } from 'contentful-management'
import { ServiceAccountKeyId, ServiceAccountKey } from 'types'

interface Props {
  contentTypes: ContentTypeProps[]
  isSavedRow: boolean
}

export default function ContentTypeOptionRow(props: Props) {
  const { contentTypes, isSavedRow } = props;

  const [selectedContentType, setSelectedContentType] = useState<ContentTypeProps>();
  const [fields, setFields] = useState<ContentFields[]>([]);
  const [selectedField, setSelectedFields] = useState<ContentFields>();
  const [urlPrefix, setUrlPrefix] = useState<string>('')

  const handleContentTypeSelection = (event: any) => {
    const _selectedContentType = JSON.parse(event.target.value) as ContentTypeProps
    setSelectedContentType(_selectedContentType)
    setFields(_selectedContentType.fields);
  }

  const handleFieldSelection = (event: any) => {
    const _selectedField = JSON.parse(event.target.value) as ContentFields
    setSelectedFields(_selectedField);
  }

  return (
    <Stack marginBottom='none' spacing="spacingS">
      <Box style={{ minWidth: '200px' }}>
        <SimpleDropdown selectId='contentTypeSelect' formTitle='Content Type' isDisabled={false} onSelectionChange={handleContentTypeSelection}>
          {contentTypes.map((contentType) => {
            return (<Select.Option value={JSON.stringify(contentType)}>{`${contentType.name}`}</Select.Option>)
          })}
        </SimpleDropdown>
      </Box>
      <Box style={{ minWidth: '200px' }}>
        <SimpleDropdown selectId='fieldSelect' formTitle='Field' isDisabled={!selectedContentType} onSelectionChange={handleFieldSelection}>
          {fields.map((field) => {
            return (<Select.Option value={JSON.stringify(field)}>{`${field.name}`}</Select.Option>)
          })}
        </SimpleDropdown>
      </Box>
      <Box style={{ minWidth: '200px' }}>
        <FormControl>
          <FormControl.Label>Url Prefix</FormControl.Label>
          <TextInput
            value={urlPrefix}
            name="urlPrefix"
            placeholder="url prefix"
            onChange={(e) => setUrlPrefix(e.target.value)}
          />
        </FormControl>
      </Box>
      {!isSavedRow && <Button>Save</Button>}
      <Button>Remove</Button>
    </Stack>
  )
}
