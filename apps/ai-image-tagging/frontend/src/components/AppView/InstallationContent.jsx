import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, FormControl, Flex, TextInput } from '@contentful/f36-components';
import { styles } from './styles';

export function InstallationContent({
  allContentTypesIds,
  contentTypeId,
  contentTypeName,
  onContentTypeNameChange,
  onContentTypeIdChange,
}) {
  const validationMessageId = allContentTypesIds.includes(contentTypeId)
    ? `A content type with ID "${contentTypeId}" already exists. Try a different ID.`
    : null;

  return (
    <>
      <Heading className={styles.heading}>Configuration</Heading>
      <Paragraph>
        To help you get started, we are going to create a content type for you with a title field,
        an image field and a image tags field.
      </Paragraph>
      <FormControl id="content-type-name" testId="content-type-name" className={styles.input}>
        <FormControl.Label>Content type name</FormControl.Label>
        <TextInput
          name="contentTypeName"
          placeholder="e.g. AI Tagged Image"
          testId="content-type-name-input"
          value={contentTypeName}
          onChange={onContentTypeNameChange}
          required
        />
        <Flex justifyContent="space-between">
          <FormControl.HelpText>
            You can use this content type to add tags to images
          </FormControl.HelpText>
        </Flex>
      </FormControl>
      <FormControl id="content-type-id" testId="content-type-id" className={styles.input}>
        <FormControl.Label>Content type ID</FormControl.Label>
        <TextInput
          name="contentTypeId"
          value={contentTypeId}
          onChange={onContentTypeIdChange}
          testId="content-type-id-input"
          required
        />
        <Flex justifyContent="space-between">
          <FormControl.HelpText>
            The ID is generated from the name, you can also set it manually
          </FormControl.HelpText>
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
