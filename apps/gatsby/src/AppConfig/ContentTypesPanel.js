import {
  Button,
  Flex,
  FieldGroup,
  Heading,
  Note,
  Modal,
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

const sortContentTypesAlphabetically = (contentTypes) => {
  const sorted = contentTypes.sort((type1, type2) => {
    if (type1.name < type2.name) {
      return -1
    }
    if (type1.name > type2.name) {
      return 1
    }
    return 0
  })
  return sorted
}

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

const UrlInput = ({urlConstructors, id, onSlugInput, placeholder, disabled}) => {
  const valueIndex = urlConstructors.findIndex(constructor => constructor.id === id)
  const value = valueIndex !== -1 ? urlConstructors[valueIndex].slug : ""
  return (
    <TextInput disabled={disabled} id={id} value={value} onChange={(event) => onSlugInput(id, event.target.value)} placeholder={placeholder} />
  )
}

export const ContentTypesSelection = ({
  contentTypes,
  enabledContentTypes,
  urlConstructors,
  disableContentType,
  onSlugInput,
  onContentTypeToggle,
  selectorTypeToggle,
  selectorType,
  space,
  environment,
}) => {
  if (!contentTypes) {
    return <ContentTypesSkeleton />;
  }

  if (0 === contentTypes.length) {
    return <NoContentTypes space={space} environment={environment} />;
  }
  
  const fullEnabledTypes = enabledContentTypes.map(enabledType => {
    const fullType = contentTypes.find(type => type.sys.id === enabledType)
    return fullType
  })

  //Focus value to compare with selection value to determine whether an update in state is necessary
  const [focusValue, changeFocus] = useState("");
  //Modal state
  const [modalState, updateModalState] = useState({
    open: false,
    id: ""
  })

  //Function to reset modal state
  const modalReset = () => {
    updateModalState(
      {
        open: false,
        id: ""
      }
    )
  }

  const sortedContentTypes = sortContentTypesAlphabetically(contentTypes)

  return ( 
    <>
    {/* Selectors for existing enabled content types */}
      {fullEnabledTypes.map(({ sys }, index) => (
      <Flex marginBottom="spacingM" key={`fullSelect - ${sys.id}`}>
        <Flex marginRight = "spacingS">
          <Select value={sys.id} 
            onFocus={(event) => changeFocus(event.target.value)}
            onChange={(event)=> onContentTypeToggle(event.target.value, focusValue)} 
          >
            {sortedContentTypes.map(({name, sys}) => 
              <Option key={`option - ${sys.id}`} value={sys.id}>
                {name}
              </Option>
            )}
          </Select>
        </Flex>
        <Flex fullWidth marginRight = "spacingS">
          <UrlInput id={sys.id} onSlugInput={onSlugInput} urlConstructors={urlConstructors} placeholder={'slugField || "example"/parentField.slugField'}/>
        </Flex>
        <Flex>
          <TextLink onClick={() => updateModalState({open: true, id: sys.id})}>
            Remove
          </TextLink>
        </Flex>
      </Flex>
      ))}

      {/* Selector triggered by add content type button */}
      {selectorType && (
        <Flex marginBottom="spacingM" key={`fullSelect - selector`}>
        <Flex marginRight = "spacingS">
          <Select
            onFocus={(event) => changeFocus(event.target.value)}
            onChange={(event) => {
              onContentTypeToggle(event.target.value, focusValue)
              selectorTypeToggle()
            }} 
          >
            <Option selected disabled  value>
                {"Select a content type"}
            </Option>
            {sortedContentTypes.map(({name, sys}) => 
              <Option key={sys.id} value={sys.id}>
                {name}
              </Option>
            )}
          </Select>
        </Flex>
        <Flex fullWidth marginRight = "spacingS">
          <UrlInput disabled onSlugInput={onSlugInput} urlConstructors={urlConstructors} placeholder={'slugField || "example"/parentField.slugField'}/>
        </Flex>
        <Flex>
          <TextLink onClick={() => selectorTypeToggle()}>Remove</TextLink>
        </Flex>
      </Flex>
      )}

      {/* Button to add a new content type */}
      <Flex justifyContent="center" marginTop="spacingXl">
        <Button disabled={selectorType} onClick={() => selectorTypeToggle()}>
          Add Content Type
        </Button>
      </Flex>

      {/* Modal to confirm removal of contentType */}
      <Modal isShown={modalState.open} onClose={() => modalReset()}>
        {() => (
          <>
            <Modal.Header title={"Are you sure?"}></Modal.Header>
            <Modal.Controls position={"left"}>
              <Flex marginTop={"spacingXl"}>
                <Button buttonType="positive" onClick={() => {
                  disableContentType(modalState.id)
                  modalReset()
                }}>Remove</Button>
                <Button buttonType="muted" onClick={() => modalReset()}>
                  Do not remove
                </Button>
              </Flex>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </>
  )
};

const ContentTypesPanel = ({
  contentTypes,
  enabledContentTypes,
  urlConstructors,
  onContentTypeToggle,
  disableContentType,
  selectorTypeToggle,
  onSlugInput,
  selectorType,
  space,
  environment,
}) => (
  <Typography>
    <Heading>Content Types</Heading>
    <Paragraph>
      Select content types that will show the Gatsby Cloud functionality in the
      sidebar. Optionally, define slugs using strings or fields on the content type. A string must be contained in quotes. Fields must be expressed in dot notation (allows for children of references).
    </Paragraph>
    <div className={styles.checks}>
      <FieldGroup>
        <ContentTypesSelection 
          space={space}
          environment={environment}
          contentTypes={contentTypes}
          enabledContentTypes={enabledContentTypes}
          urlConstructors={urlConstructors}
          onSlugInput={onSlugInput}
          onContentTypeToggle={onContentTypeToggle} 
          disableContentType={disableContentType} 
          selectorTypeToggle={selectorTypeToggle}
          selectorType={selectorType}
        />
      </FieldGroup>
    </div>
  </Typography>
);

export default ContentTypesPanel;
