import React, { useState } from 'react'
import { Box, Button, Flex, FormControl, Select, Stack, TextInput } from '@contentful/f36-components'
import SimpleDropdown from 'components/common/SimpleDropdown'
import { ContentFields, ContentTypeProps, KeyValueMap } from 'contentful-management'
import { ServiceAccountKeyId, ServiceAccountKey } from 'types'

interface Props {
  contentTypes: ContentTypeProps[]
}

export default function MapContentTypeRow(props: Props) {
  const { contentTypes } = props;

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

  const handleRemoveButton = () => {
    
  }

  return (
    <Stack marginBottom='none' spacing="spacingS" alignItems='baseline'>
      <Box style={{ minWidth: '200px' }}>
        <FormControl>
          <Select defaultValue="" isDisabled={false} onChange={handleContentTypeSelection}>
            <Select.Option value="" isDisabled />
            {contentTypes.map((contentType) => {
              return (<Select.Option key={contentType.sys.id} value={JSON.stringify(contentType)}>{`${contentType.name}`}</Select.Option>)
            })}
          </Select>
        </FormControl>
      </Box>
      <Box style={{ minWidth: '200px' }}>
        <FormControl>
          <Select defaultValue="" isDisabled={!selectedContentType} onChange={handleFieldSelection}>
            <Select.Option value="" isDisabled />
            {fields.map((field) => {
              return (<Select.Option key={field.id} value={JSON.stringify(field)}>{`${field.name}`}</Select.Option>)
            })}
          </Select>
        </FormControl>
      </Box>
      <Box style={{ minWidth: '200px' }}>
        <FormControl>
          <TextInput
            value={urlPrefix}
            name="urlPrefix"
            placeholder="url prefix"
            onChange={(e) => setUrlPrefix(e.target.value)}
          />
        </FormControl>
      </Box>
      <Button onClick={handleRemoveButton} variant='negative'>Remove</Button>
    </Stack>
  )
}
