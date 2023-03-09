import { useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading } from '@contentful/f36-components';
import { AllContentTypes } from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import sortBy from 'lodash/sortBy';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { ContentTypeProps, createClient } from 'contentful-management';
import useKeyService from 'hooks/useKeyService';

const AssignContentTypePage = () => {
  const {
    contentTypeEntries,
    handleContentTypeChange,
    handleContentTypeFieldChange,
    handleAddContentType,
    handleRemoveContentType,
  } = useKeyService({});

  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);

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
    };

    getContentTypes();
  }, [sdk]);

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <Subheading marginBottom="none">Assign to content types</Subheading>
      <Paragraph marginBottom="none">
        Select which content types will show the Google Analytics functionality in the sidebar.
        Specify the slug field that is used for URL generation in your application. Optionally,
        specify a prefix for the slug.
      </Paragraph>
      <AssignContentTypeCard
        allContentTypes={allContentTypes}
        contentTypeEntries={contentTypeEntries}
        onContentTypeChange={handleContentTypeChange}
        onContentTypeFieldChange={handleContentTypeFieldChange}
        onAddContentType={handleAddContentType}
        onRemoveContentType={handleRemoveContentType}
      />
    </Stack>
  );
};

export default AssignContentTypePage;
