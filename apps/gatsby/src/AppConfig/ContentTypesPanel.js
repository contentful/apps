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
  TextInput,
  Typography,
} from "@contentful/forma-36-react-components";
import styles from "../styles";
import React, {useState} from "react";

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

// export const ContentTypesList = ({
//   contentTypes,
//   enabledContentTypes,
//   onContentTypeToggle,
//   space,
//   environment,
// }) => {
//   if (!contentTypes) {
//     return <ContentTypesSkeleton />;
//   }

//   if (0 === contentTypes.length) {
//     return <NoContentTypes space={space} environment={environment} />;
//   }

//   // console.log(enabledContentTypes)
//   // console.log(contentTypes)

//   return contentTypes.map(({ sys, name }) => (
//     <CheckboxField
//       key={sys.id}
//       labelIsLight
//       labelText={name}
//       name={name}
//       checked={enabledContentTypes.includes(sys.id)}
//       value={sys.id}
//       onChange={() => onContentTypeToggle(sys.id)}
//       id={sys.id}
//     />
//   ));
// };

const UrlInput = ({urlConstructors, id, onSlugInput}) => {
  const valueIndex = urlConstructors.findIndex(constructor => constructor.id === id)
  const value = valueIndex !== -1 ? urlConstructors[valueIndex].slug : ""
  return (
    <TextInput id={id} value={value} onChange={(event)=> onSlugInput(id, event.target.value)} />
  )
}

export const ContentTypesSelection = ({
  contentTypes,
  enabledContentTypes,
  urlConstructors,
  onSlugInput,
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
  const fullEnabledTypes = contentTypes.filter(type => enabledContentTypes.findIndex(enabledType => enabledType === type.sys.id) !== -1)
  // State to maintain previous value of a select in case it is changed
  const [focusValue, changeFocus] = useState("");
  return fullEnabledTypes.map(({ sys }) => (
   <Flex>
     <Flex>
       <Select value={sys.id} 
        onFocus={(event) => changeFocus(event.target.value)}
        onChange={(event)=>onContentTypeToggle(event.target.value, focusValue)} 
       >
         {contentTypes.map(({name, sys}) => <Option key={`option - ${sys.id}`} value={sys.id}>{name}</Option>)}
       </Select>
       <UrlInput id={sys.id} onSlugInput={onSlugInput} urlConstructors={urlConstructors} />
     </Flex>
   </Flex>
  ));
};

const ContentTypesPanel = ({
  contentTypes,
  enabledContentTypes,
  urlConstructors,
  onContentTypeToggle,
  onSlugInput,
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
        {/* <ContentTypesList
          space={space}
          environment={environment}
          contentTypes={contentTypes}
          enabledContentTypes={enabledContentTypes}
          onContentTypeToggle={onContentTypeToggle}
        /> */}
        <ContentTypesSelection 
          space={space}
          environment={environment}
          contentTypes={contentTypes}
          enabledContentTypes={enabledContentTypes}
          urlConstructors={urlConstructors}
          onSlugInput={onSlugInput}
          onContentTypeToggle={onContentTypeToggle} />
      </FieldGroup>
    </div>
  </Typography>
);

export default ContentTypesPanel;
