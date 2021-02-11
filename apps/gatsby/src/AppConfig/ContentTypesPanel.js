import {
  CheckboxField,
  Flex,
  FieldGroup,
  Heading,
  Note,
  Option,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Select,
  TextLink,
  Typography,
} from "@contentful/forma-36-react-components";
import styles from "../styles";
import React from "react";

const ContentTypesSkeleton = () => (
  <SkeletonContainer width="100%">
    <SkeletonBodyText numberOfLines={3} />
  </SkeletonContainer>
);

const NoContentTypes = ({ space, environment }) => (
  <Note noteType="warning">
    There are no content types available in this environment. You can add one{" "}
    <TextLink
      target="_blank"
      href={
        environment === "master"
          ? `https://app.contentful.com/spaces/${space}/content_types`
          : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
      }
      rel="noopener noreferrer"
    >
      content type
    </TextLink>{" "}
    and assign it to the app from this screen.
  </Note>
);

export const ContentTypesList = ({
  contentTypes,
  enabledContentTypes,
  onContentTypeToggle,
  space,
  environment,
}) => {
  if (!contentTypes) {
    return <ContentTypesSkeleton />;
  }

  if (0 === contentTypes.length) {
    return <NoContentTypes space={space} environment={environment} />;
  }


  return (
    <>
      <>
        { enabledContentTypes.map(({ sys, name }) => (
          <Flex>
            <Select
              key={sys.id}
              labelIsLight
              labelText={name}
              name={name}
              value={sys.id}
              onChange={() => onContentTypeToggle(sys.id)}
              id={sys.id}>
                {contentTypes.map(type => <Option value={type.sys.id}>{type.name}</Option>)}
            </Select>
          </Flex>
        ))}
      </>
      <>
        <Flex>
          <Select onChange={(event) => onContentTypeToggle(event.target.value)}>
            {contentTypes.map(type => <Option value={type.sys.id}>{type.name}</Option>)}
          </Select>
        </Flex>
      </>
    </>
  
  )
};

const ContentTypesPanel = ({
  contentTypes,
  enabledContentTypes,
  onContentTypeToggle,
  space,
  environment,
}) => (
  <Typography>
    <Heading>Content Types</Heading>
    <Paragraph>
      Select content types that will show the Gatsby Cloud functionality in the
      sidebar.
    </Paragraph>
    <div className={styles.checks}>
      <FieldGroup>
        <ContentTypesList
          space={space}
          environment={environment}
          contentTypes={contentTypes}
          enabledContentTypes={enabledContentTypes}
          onContentTypeToggle={onContentTypeToggle}
        />
      </FieldGroup>
    </div>
  </Typography>
);

export default ContentTypesPanel;
