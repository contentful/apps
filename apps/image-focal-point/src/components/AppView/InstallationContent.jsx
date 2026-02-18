import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Paragraph,
  FormControl,
  TextInput,
  Flex,
  Radio,
  Select,
  Box,
  Note,
} from '@contentful/f36-components';
import { styles } from './styles';

export function InstallationContent({
  allContentTypesIds,
  contentTypeId,
  contentTypeName,
  onContentTypeNameChange,
  onContentTypeIdChange,
  useExistingContentType,
  onUseExistingContentTypeChange,
  eligibleContentTypes,
  selectedExistingContentTypeId,
  onSelectedExistingContentTypeChange,
  selectedFocalPointFieldId,
  onSelectedFocalPointFieldChange,
  selectedImageFieldId,
  onSelectedImageFieldChange,
}) {
  const validationMessageName = allContentTypesIds.includes(contentTypeId)
    ? `A content type with ID "${contentTypeId}" already exists. Try a different name.`
    : null;

  const validationMessageId = allContentTypesIds.includes(contentTypeId)
    ? `A content type with ID "${contentTypeId}" already exists. Try a different ID.`
    : null;

  const selectedContentType = eligibleContentTypes.find(
    (ct) => ct.sys.id === selectedExistingContentTypeId
  );

  const objectFields = selectedContentType
    ? selectedContentType.fields.filter((field) => field.type === 'Object')
    : [];

  const assetFields = selectedContentType
    ? selectedContentType.fields.filter(
        (field) => field.type === 'Link' && field.linkType === 'Asset'
      )
    : [];

  return (
    <>
      <Heading className={styles.heading}>Configuration</Heading>
      <Paragraph>
        Choose whether to create a new content type or use an existing one that has both a JSON
        Object field (for focal point data) and an Asset field (for the image).
      </Paragraph>

      <Box marginBottom="spacingM">
        <Radio.Group
          name="contentTypeOption"
          value={useExistingContentType ? 'existing' : 'new'}
          onChange={(e) => onUseExistingContentTypeChange(e.target.value === 'existing')}>
          <Radio value="new">Create a new content type</Radio>
          <Radio value="existing">Use an existing content type</Radio>
        </Radio.Group>
      </Box>

      {!useExistingContentType && (
        <>
          <Paragraph>
            We will create a content type for you with a title field, an image field and a focal
            point field.
          </Paragraph>
          <FormControl id="content-type-name" testId="content-type-name">
            <FormControl.Label>Content type name</FormControl.Label>
            <TextInput
              placeholder="e.g. Image with Focal Point"
              name="contentTypeName"
              testId="content-type-name-input"
              value={contentTypeName}
              onChange={onContentTypeNameChange}
              className={styles.input}
              required
            />
            <Flex justifyContent="space-between">
              <FormControl.HelpText>
                You can use this content type to wrap images with focal point data
              </FormControl.HelpText>
              <FormControl.Counter />
            </Flex>
            {validationMessageName && (
              <FormControl.ValidationMessage>{validationMessageName}</FormControl.ValidationMessage>
            )}
          </FormControl>
          <FormControl id="content-type-id" testId="content-type-id">
            <FormControl.Label>Content type ID</FormControl.Label>
            <TextInput
              name="contentTypeId"
              testId="content-type-id-input"
              value={contentTypeId}
              onChange={onContentTypeIdChange}
              className={styles.input}
              required
            />
            <Flex justifyContent="space-between">
              <FormControl.HelpText>
                The ID is generated from the name, you can also set it manually
              </FormControl.HelpText>
              <FormControl.Counter />
            </Flex>
            {validationMessageId && (
              <FormControl.ValidationMessage>{validationMessageId}</FormControl.ValidationMessage>
            )}
          </FormControl>
        </>
      )}

      {useExistingContentType && (
        <>
          {eligibleContentTypes.length === 0 ? (
            <Note variant="warning">
              No eligible content types found. A content type must have both a JSON Object field
              (for focal point data) and an Asset field (for the image).
            </Note>
          ) : (
            <>
              <FormControl id="existing-content-type" testId="existing-content-type">
                <FormControl.Label>Content type</FormControl.Label>
                <Select
                  id="existing-content-type-select"
                  name="existingContentType"
                  value={selectedExistingContentTypeId}
                  onChange={(e) => onSelectedExistingContentTypeChange(e.target.value)}>
                  <Select.Option value="" isDisabled>
                    Select a content type
                  </Select.Option>
                  {eligibleContentTypes.map((ct) => (
                    <Select.Option key={ct.sys.id} value={ct.sys.id}>
                      {ct.name}
                    </Select.Option>
                  ))}
                </Select>
                <FormControl.HelpText>
                  Only content types with both a JSON Object field and an Asset field are shown
                </FormControl.HelpText>
              </FormControl>

              {selectedExistingContentTypeId && (
                <Box marginTop="spacingM">
                  <FormControl id="focal-point-field" testId="focal-point-field">
                    <FormControl.Label>Focal point field</FormControl.Label>
                    <Select
                      id="focal-point-field-select"
                      name="focalPointField"
                      value={selectedFocalPointFieldId}
                      onChange={(e) => onSelectedFocalPointFieldChange(e.target.value)}>
                      <Select.Option value="" isDisabled>
                        Select a field
                      </Select.Option>
                      {objectFields.map((field) => (
                        <Select.Option key={field.id} value={field.id}>
                          {field.name} ({field.id})
                        </Select.Option>
                      ))}
                    </Select>
                    <FormControl.HelpText>
                      The JSON Object field that will store the focal point coordinates
                    </FormControl.HelpText>
                  </FormControl>

                  <FormControl id="image-field" testId="image-field" marginTop="spacingM">
                    <FormControl.Label>Image field</FormControl.Label>
                    <Select
                      id="image-field-select"
                      name="imageField"
                      value={selectedImageFieldId}
                      onChange={(e) => onSelectedImageFieldChange(e.target.value)}>
                      <Select.Option value="" isDisabled>
                        Select a field
                      </Select.Option>
                      {assetFields.map((field) => (
                        <Select.Option key={field.id} value={field.id}>
                          {field.name} ({field.id})
                        </Select.Option>
                      ))}
                    </Select>
                    <FormControl.HelpText>
                      The Asset field that contains the image
                    </FormControl.HelpText>
                  </FormControl>
                </Box>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

InstallationContent.propTypes = {
  allContentTypesIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  contentTypeId: PropTypes.string.isRequired,
  contentTypeName: PropTypes.string.isRequired,
  onContentTypeNameChange: PropTypes.func.isRequired,
  onContentTypeIdChange: PropTypes.func.isRequired,
  useExistingContentType: PropTypes.bool.isRequired,
  onUseExistingContentTypeChange: PropTypes.func.isRequired,
  eligibleContentTypes: PropTypes.arrayOf(
    PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }).isRequired,
      name: PropTypes.string.isRequired,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          type: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  selectedExistingContentTypeId: PropTypes.string.isRequired,
  onSelectedExistingContentTypeChange: PropTypes.func.isRequired,
  selectedFocalPointFieldId: PropTypes.string.isRequired,
  onSelectedFocalPointFieldChange: PropTypes.func.isRequired,
  selectedImageFieldId: PropTypes.string.isRequired,
  onSelectedImageFieldChange: PropTypes.func.isRequired,
};
