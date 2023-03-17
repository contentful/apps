import { useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading, Button, Spinner, Box } from '@contentful/f36-components';
import { ContentTypeProps, createClient } from 'contentful-management';
import { AppExtensionSDK, EditorInterface } from '@contentful/app-sdk';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  AllContentTypes,
  AllContentTypeEntries,
  ContentTypeEntries,
  ContentTypes,
  ContentTypeValue,
} from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import { sortAndFormatAllContentTypes } from 'helpers/contentTypeHelpers/contentTypeHelpers';
interface Props {
  mergeSdkParameters: Function;
  onIsValidContentTypeAssignment: Function;
  parameters: KeyValueMap;
  currentEditorInterface: Partial<EditorInterface>;
  originalParameters: KeyValueMap;
}

const AssignContentTypeSection = (props: Props) => {
  const {
    mergeSdkParameters,
    onIsValidContentTypeAssignment,
    parameters,
    currentEditorInterface,
    originalParameters,
  } = props;

  // Content type state
  const [contentTypes, setContentTypes] = useState<ContentTypes>({} as ContentTypes);
  const [loadingContentTypes, setLoadingContentTypes] = useState<boolean>(true);
  const [hasContentTypes, setHasContentTypes] = useState<boolean>(false);
  const [contentTypeEntries, setContentTypeEntries] = useState<ContentTypeEntries>(
    [] as ContentTypeEntries
  );
  const [hasIncompleteContentTypes, setHasIncompleteContentTypes] = useState<boolean>(false);

  // All content type state
  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);
  const [allContentTypeEntries, setAllContentTypeEntries] = useState<AllContentTypeEntries>(
    [] as AllContentTypeEntries
  );
  const [loadingAllContentTypes, setLoadingAllContentTypes] = useState<boolean>(true);

  const sdk = useSDK<AppExtensionSDK>();

  useEffect(() => {
    if (parameters.contentTypes) setContentTypes(parameters.contentTypes);
    setLoadingContentTypes(false);
  }, [parameters.contentTypes]);

  useEffect(() => {
    setHasContentTypes(Object.keys(contentTypes).length ? true : false);
    setContentTypeEntries(Object.entries(contentTypes));
    setHasIncompleteContentTypes(
      Object.entries(contentTypes).some(([contentTypeId]) => !contentTypeId)
    );
  }, [contentTypes]);

  useEffect(() => {
    const getAllContentTypes = async () => {
      const cma = createClient({ apiAdapter: sdk.cmaAdapter });
      const space = await cma.getSpace(sdk.ids.space);
      const environment = await space.getEnvironment(sdk.ids.environment);
      const contentTypes = await environment.getContentTypes();

      const formattedContentTypes = sortAndFormatAllContentTypes(
        contentTypes.items as ContentTypeProps[]
      );

      setAllContentTypes(formattedContentTypes);
      setAllContentTypeEntries(Object.entries(formattedContentTypes));
      setLoadingAllContentTypes(false);
    };

    getAllContentTypes();
  }, [sdk]);

  const contentTypeHandler = (newContentTypes: ContentTypes) => {
    setContentTypes(newContentTypes);
    const _parameters = { contentTypes: newContentTypes };
    mergeSdkParameters(_parameters);

    // Do not allow saving an empty content type or one that was deleted
    let hasValidContentTypes = true;

    for (const contentType in newContentTypes) {
      if (!contentType || !allContentTypeEntries.find((entry) => entry[0] === contentType)) {
        hasValidContentTypes = false;
        break;
      }
    }

    onIsValidContentTypeAssignment(hasValidContentTypes);
  };

  const handleContentTypeChange = (prevKey: string, newKey: string) => {
    const newContentTypes: ContentTypes = {};

    for (const [prop, value] of Object.entries(contentTypes)) {
      if (prop === prevKey) {
        newContentTypes[newKey as keyof typeof contentTypes] = {
          slugField: '',
          urlPrefix: value.urlPrefix,
        };
      } else {
        newContentTypes[prop] = value;
      }
    }

    contentTypeHandler(newContentTypes);
  };

  const handleContentTypeFieldChange = (key: string, field: string, value: string) => {
    const currentContentTypeFields: ContentTypeValue = contentTypes[key];
    const newContentTypes: ContentTypes = {
      ...contentTypes,
      [key]: {
        ...currentContentTypeFields,
        [field]: value,
      },
    };

    contentTypeHandler(newContentTypes);
  };

  const handleAddContentType = () => {
    const newContentTypes: ContentTypes = {
      ...contentTypes,
      '': { slugField: '', urlPrefix: '' },
    };

    contentTypeHandler(newContentTypes);
  };

  const handleRemoveContentType = (key: string) => {
    const newContentTypes = { ...contentTypes };
    delete newContentTypes[key];

    contentTypeHandler(newContentTypes);
  };

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <Box>
        <Subheading marginBottom="spacingXs">Content type configuration</Subheading>
        <Paragraph marginBottom="none">
          Select which content types will show the Google Analytics functionality in the sidebar.
          Specify the slug field that is used for URL generation in your application. Optionally,
          specify a prefix for the slug.
        </Paragraph>
      </Box>
      {!loadingContentTypes && !loadingAllContentTypes ? (
        <>
          {hasContentTypes && (
            <AssignContentTypeCard
              allContentTypes={allContentTypes}
              allContentTypeEntries={allContentTypeEntries}
              contentTypes={contentTypes}
              contentTypeEntries={contentTypeEntries}
              onContentTypeChange={handleContentTypeChange}
              onContentTypeFieldChange={handleContentTypeFieldChange}
              onRemoveContentType={handleRemoveContentType}
              currentEditorInterface={currentEditorInterface}
              originalParameters={originalParameters}
            />
          )}
          <Button onClick={handleAddContentType} isDisabled={hasIncompleteContentTypes}>
            {hasContentTypes ? 'Add another content type' : 'Add a content type'}
          </Button>
        </>
      ) : (
        <Spinner variant="primary" />
      )}
    </Stack>
  );
};

export default AssignContentTypeSection;
