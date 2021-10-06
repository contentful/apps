import {
  Button,
  Flex,
  FieldGroup,
  Heading,
  List,
  ListItem,
  Modal,
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
    There are no content types available in this environment. You can add one
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
    </TextLink>
    and assign it to the app from this screen.
  </Note>
);

const UrlInput = ({urlConstructors, id, onSlugInput, placeholder, disabled}) => {
  const valueIndex = urlConstructors ? urlConstructors.findIndex(constructor => constructor.id === id) : -1
  const value = valueIndex !== -1 ? urlConstructors[valueIndex].slug : ""
  return (
    <TextInput 
      disabled={disabled} 
      id={id} 
      value={value} 
      onChange={(event) => onSlugInput(id, event.target.value)} 
      placeholder={placeholder} 
      width={"full"}
    />
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
  //Focus value to compare with selection value to determine whether an update in state is necessary
  const [focusValue, changeFocus] = useState("");
  //Modal state
  const [modalState, updateModalState] = useState({
    open: false,
    id: ""
  })

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
    {fullEnabledTypes.map(({ sys }, index) => {
      return (
        <Flex marginBottom="spacingM">
          <Flex marginRight = "spacingS" flexDirection="column">
            <Select
              key={`enabledSelect-${index}`}
              value={sys.id} 
              onFocus={(event) => changeFocus(event.target.value)}
              onChange={(event)=> {
                onContentTypeToggle(event.target.value, focusValue)
                event.target.blur() //Have to blur target for correct focus value in the case dropdown is changed multiple times
              }}
              width={"medium"}
            >
              {sortedContentTypes.map(({name, sys}) => 
                <Option key={`option - ${sys.id}`} value={sys.id} label={name}>
                  {name}
                </Option>
              )}
            </Select>
          </Flex>
          <Flex fullWidth flexDirection="column" marginRight = "spacingS">
            <UrlInput 
              id={sys.id} 
              onSlugInput={onSlugInput} 
              urlConstructors={urlConstructors} 
              placeholder={'(Optional) slug'}
            />
          </Flex>
          <Flex>
            <TextLink linkType="negative" onClick={() => updateModalState({open: true, id: sys.id})}>
              Remove
            </TextLink>
          </Flex>
        </Flex>
      )}
    )}

      {/* Selector triggered by add content type button */}
      {selectorType && (
      <Flex marginBottom="spacingM">
        <Flex marginRight = "spacingS">
          <Select
            onChange={(event) => {
              onContentTypeToggle(event.target.value, null)
              selectorTypeToggle()
            }}
            defaultValue
            width={"medium"}
            key={"placeholder"}
          >
            <Option  disabled  value>
              {"Select a content type"}
            </Option>
            {sortedContentTypes.map(({name, sys}) => {
              // Check if the type is already selected so it can be disabled if so
              const selected = fullEnabledTypes.findIndex(type => type.name === name) !== -1;
                return (
                  <Option 
                    disabled={selected} 
                    key={sys.id} 
                    value={sys.id} 
                    label={`${name}${selected ? " – already selected":""}`}
                  >
                    {name}
                  </Option>
                )
            })}
          </Select>
        </Flex>
        <Flex fullWidth marginRight = "spacingS">
          <UrlInput 
            disabled 
            onSlugInput={onSlugInput} 
            urlConstructors={urlConstructors} 
            placeholder={'(Optional) slug'}
          />
        </Flex>
        <Flex>
          <TextLink linkType="negative" onClick={() => selectorTypeToggle()}>Remove</TextLink>
        </Flex>
      </Flex>
      )}

      {/* Button to add a new content type */}
      <Flex justifyContent="left" marginTop="spacingXl">
        <Button buttonType="muted" disabled={selectorType} onClick={() => selectorTypeToggle()}>
          Add content type
        </Button>
      </Flex>


      {/* Modal to confirm removal of contentType */}
      <Modal isShown={modalState.open} onClose={() => modalReset()}>
        {() => (
          <>
            <Modal.Header title={"Are you sure?"}></Modal.Header>
            <Modal.Controls position={"left"}>
              <Flex marginTop={"spacingXl"}>
                <Button buttonType="positive" 
                  onClick={() => {
                    disableContentType(modalState.id)
                    modalReset()
                  }}
                >
                  Remove
                </Button>
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
    <Heading>Slug Configuration</Heading>
    <Paragraph>
    You may need to define slugs for content types if CMS Preview is unable to route editors to the correct URL. In most cases, this is not required.
    </Paragraph>
    <Paragraph>
        <TextLink
          target="_blank"
          href={"https://youtu.be/81JqPzLhPzk"}
          rel="noopener noreferrer"
        >
          Watch short explainer video on optional slugs here.
        </TextLink>
      </Paragraph>
    <Paragraph>
    Define slugs using:
    </Paragraph>
    <List>
      <ListItem key={`instruction-1`}>
        <Paragraph>
          Strings (must be contained in quotes, will be the same for every entry): <strong>"resources"</strong>
        </Paragraph>
      </ListItem>
      <ListItem key={`instruction-2`}>
        <Paragraph>
          Dot notation to access fields (will return field value for the entry): <strong>parentField.slug</strong>
        </Paragraph>
      </ListItem>
      <ListItem key={`instruction-3`}>
        <Paragraph>
          Backslashes (to seperate different parts of the slug): <strong>"resources"/slugPrefix/parentField.slug</strong>
        </Paragraph>
      </ListItem>
      </List>



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

  </Typography>
);

export default ContentTypesPanel;
