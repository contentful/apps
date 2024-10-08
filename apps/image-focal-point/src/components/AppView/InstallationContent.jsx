import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, FormControl, TextInput, Flex } from '@contentful/f36-components';
import { styles } from './styles';

export function InstallationContent({
  allContentTypesIds,
  contentTypeId,
  contentTypeName,
  onContentTypeNameChange,
  onContentTypeIdChange,
}) {
  const validationMessageName = allContentTypesIds.includes(contentTypeId)
    ? `A content type with ID "${contentTypeId}" already exists. Try a different name.`
    : null;

  const validationMessageId = allContentTypesIds.includes(contentTypeId)
    ? `A content type with ID "${contentTypeId}" already exists. Try a different ID.`
    : null;

  return (
    <>
      <Heading className={styles.heading}>Configuration</Heading>
      <Paragraph>
        To help you get started, we are going to create a content type for you with a title field,
        an image field and a focal point field.
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
        <FormControl.ValidationMessage>{validationMessageName}</FormControl.ValidationMessage>
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
        <FormControl.ValidationMessage>{validationMessageId}</FormControl.ValidationMessage>
      </FormControl>
    </>
  );
}

InstallationContent.propTypes = {
  allContentTypesIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  contentTypeId: PropTypes.string.isRequired,
  contentTypeName: PropTypes.string.isRequired,
  onContentTypeNameChange: PropTypes.func.isRequired,
  onContentTypeIdChange: PropTypes.func.isRequired,
};
