import { useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading, Button, Spinner } from '@contentful/f36-components';
import { ContentTypeEntries } from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import useKeyService from 'hooks/useKeyService';

const AssignContentTypeSection = () => {
  const {
    contentTypes,
    loadingParameters,
    allContentTypes,
    allContentTypeEntries,
    loadingAllContentTypes,
    handleContentTypeChange,
    handleContentTypeFieldChange,
    handleAddContentType,
    handleRemoveContentType,
  } = useKeyService({});

  const [hasContentTypes, setHasContentTypes] = useState<boolean>(false);
  const [contentTypeEntries, setHasContentTypeEntries] = useState<ContentTypeEntries>(
    [] as ContentTypeEntries
  );
  const [hasIncompleteContentTypes, setHasIncompleteContentTypes] = useState<boolean>(false);

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
