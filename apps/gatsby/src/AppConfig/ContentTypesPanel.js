import {
  CheckboxField,
  FieldGroup,
  Heading,
  Note,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  TextLink,
  Typography
} from '@contentful/forma-36-react-components';
import styles from '../styles';
import React from 'react';

const ContentTypesSkeleton = () => (
  <SkeletonContainer width="100%">
    <SkeletonBodyText numberOfLines={3}/>
  </SkeletonContainer>
);

const NoContentTypes = () => (
  <Note noteType="warning">
    There are no content types available in this environment. <TextLink
    href="https://www.contentful.com/faq/basics/#how-do-i-add-a-new-content-type" target="_blank"
    rel="noopener noreferrer">How do I add a new content type?</TextLink>
  </Note>
);

export const ContentTypesList = ({ contentTypes, enabledContentTypes, onContentTypeToggle }) => {
  if (!contentTypes) {
    return <ContentTypesSkeleton/>;
  }

  if (0 === contentTypes.length) {
    return <NoContentTypes/>;
  }

  return contentTypes.map(({ sys, name }) => (
    <CheckboxField
      key={sys.id}
      labelIsLight
      labelText={name}
      name={name}
      checked={enabledContentTypes.includes(sys.id)}
      value={sys.id}
      onChange={() => onContentTypeToggle(sys.id)}
      id={sys.id}
    />
  ));
};

const ContentTypesPanel = ({ contentTypes, enabledContentTypes, onContentTypeToggle }) => (
  <Typography>
    <Heading>Content Types</Heading>
    <Paragraph>
      Select content types that will show the Gatsby Cloud functionality in the sidebar.
    </Paragraph>
    <div className={styles.checks}>
      <FieldGroup>
        <ContentTypesList contentTypes={contentTypes}
                          enabledContentTypes={enabledContentTypes}
                          onContentTypeToggle={onContentTypeToggle}/>
      </FieldGroup>
    </div>

  </Typography>
);

export default ContentTypesPanel;
