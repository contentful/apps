import React from 'react';
import PropTypes from 'prop-types';
import { styles } from './styles';

import { FormControl, TextInput, Heading, Paragraph } from '@contentful/f36-components';

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
      <Heading marginBottom="none" className={styles.heading}>
        Configuration
      </Heading>
      <Paragraph marginBottom="none">
        To help you get started, we are going to create a content type for you with a title field,
        an image field and a focal point field.
      </Paragraph>
      <FormControl
        className={styles.input}
        testId="content-type-name"
        id="content-type-name"
        isRequired
        isInvalid={validationMessageName}
      >
        <FormControl.Label>Content type name</FormControl.Label>
        <TextInput
          name="contentTypeName"
          value={contentTypeName}
          onChange={onContentTypeNameChange}
          placeholder="e.g. Image with Focal Point"
          testId="content-type-name-input"
        />
        <FormControl.HelpText>
          You can use this content type to wrap images with focal point data
        </FormControl.HelpText>
        {validationMessageName && (
          <FormControl.ValidationMessage>{validationMessageName}</FormControl.ValidationMessage>
        )}
      </FormControl>
      <FormControl
        className={styles.input}
        testId="content-type-id"
        id="content-type-id"
        isRequired
        isInvalid={validationMessageId}
      >
        <FormControl.Label>Content type ID</FormControl.Label>
        <TextInput
          name="contentTypeId"
          value={contentTypeId}
          onChange={onContentTypeIdChange}
          testId="content-type-id-input"
        />
        <FormControl.HelpText>
          The ID is generated from the name, you can also set it manually
        </FormControl.HelpText>
        {validationMessageId && (
          <FormControl.ValidationMessage>{validationMessageId}</FormControl.ValidationMessage>
        )}
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
