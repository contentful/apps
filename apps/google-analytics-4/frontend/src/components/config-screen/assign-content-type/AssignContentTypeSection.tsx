import { useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading, Button, Spinner } from '@contentful/f36-components';
import { AllContentTypes, AllContentTypeEntries, ContentTypeEntries } from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import sortBy from 'lodash/sortBy';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { ContentTypeProps, createClient } from 'contentful-management';
import useKeyService from 'hooks/useKeyService';

const AssignContentTypeSection = () => {
  const {
    contentTypes,
    loadingParameters,
    handleContentTypeChange,
    handleContentTypeFieldChange,
    handleAddContentType,
    handleRemoveContentType,
  } = useKeyService({});

  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);
  const [allContentTypeEntries, setAllContentTypeEntries] = useState<AllContentTypeEntries>(
    [] as AllContentTypeEntries
  );
  const [hasContentTypes, setHasContentTypes] = useState<boolean>(false);
  const [contentTypeEntries, setHasContentTypeEntries] = useState<ContentTypeEntries>(
    [] as ContentTypeEntries
  );
  const [hasIncompleteContentTypes, setHasIncompleteContentTypes] = useState<boolean>(false);
  const [loadingAllContentTypes, setLoadingAllContentTypes] = useState<boolean>(true);

  const sdk = useSDK<AppExtensionSDK>();

  useEffect(() => {
    const getContentTypes = async () => {
      const cma = createClient({ apiAdapter: sdk.cmaAdapter });
      const space = await cma.getSpace(sdk.ids.space);
      const environment = await space.getEnvironment(sdk.ids.environment);
      const contentTypes = await environment.getContentTypes();
      const contentTypeItems = contentTypes.items as ContentTypeProps[];

      const sortedContentTypes = sortBy(contentTypeItems, ['name']);

      const formattedContentTypes = sortedContentTypes.reduce(
        (acc: AllContentTypes, contentType) => {
          // only include short text fields in the slug field dropdown
          const fields = sortBy(
            contentType.fields.filter((field) => field.type === 'Symbol'),
            ['name']
          );

          if (fields.length) {
            acc[contentType.sys.id] = {
              ...contentType,
              fields,
            };
          }

          return acc;
        },
        {}
      );

      setAllContentTypes(formattedContentTypes);
      setAllContentTypeEntries(Object.entries(formattedContentTypes));
      setLoadingAllContentTypes(false);
    };

    getContentTypes();
  }, [sdk]);

  useEffect(() => {
    setHasContentTypes(Object.keys(contentTypes).length ? true : false);
    setHasContentTypeEntries(Object.entries(contentTypes));
    setHasIncompleteContentTypes(
      Object.entries(contentTypes).some(([contentTypeId]) => !contentTypeId)
    );
  }, [contentTypes]);

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <Subheading marginBottom="none">Assign to content types</Subheading>
      <Paragraph marginBottom="none">
        Select which content types will show the Google Analytics functionality in the sidebar.
        Specify the slug field that is used for URL generation in your application. Optionally,
        specify a prefix for the slug.
      </Paragraph>
      {!loadingParameters && !loadingAllContentTypes ? (
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
