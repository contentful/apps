import { useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading, Button, Spinner } from '@contentful/f36-components';
import {
  AllContentTypes,
  AllContentTypeEntries,
  ContentTypeEntries,
  ContentTypes,
  ContentTypeValue,
} from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import sortBy from 'lodash/sortBy';
import { ContentTypeProps, createClient, KeyValueMap } from 'contentful-management';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
interface Props {
  mergeSdkParameters: Function;
  onIsValidContentTypeAssignment: Function;
  parameters: KeyValueMap;
}

const AssignContentTypeSection = (props: Props) => {
  const { mergeSdkParameters, onIsValidContentTypeAssignment, parameters } = props;

  const [contentTypes, setContentTypes] = useState<ContentTypes>({} as ContentTypes);
  const [loadingParameters, setLoadingParameters] = useState<boolean>(true);
  const [hasContentTypes, setHasContentTypes] = useState<boolean>(false);
  const [contentTypeEntries, setContentTypeEntries] = useState<ContentTypeEntries>(
    [] as ContentTypeEntries
  );
  const [hasIncompleteContentTypes, setHasIncompleteContentTypes] = useState<boolean>(false);

  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);
  const [allContentTypeEntries, setAllContentTypeEntries] = useState<AllContentTypeEntries>(
    [] as AllContentTypeEntries
  );
  const [loadingAllContentTypes, setLoadingAllContentTypes] = useState<boolean>(true);

  const sdk = useSDK<AppExtensionSDK>();

  useEffect(() => {
    if (parameters.contentTypes) setContentTypes(parameters.contentTypes);
    setLoadingParameters(false);
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

    getAllContentTypes();
  }, [sdk]);

  const contentTypeHandler = (newContentTypes: ContentTypes) => {
    setContentTypes(newContentTypes);
    const _parameters = { contentTypes: newContentTypes };
    mergeSdkParameters(_parameters);

    // Do not allow saving an empty content type
    const newContentTypeKeys = Object.keys(newContentTypes);
    if (newContentTypeKeys.some((key) => !key)) {
      onIsValidContentTypeAssignment(false);
    } else {
      onIsValidContentTypeAssignment(true);
    }
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
      <div>
        <Subheading marginBottom="spacingXs">Content type configuration</Subheading>
        <Paragraph marginBottom="none">
          Select which content types will show the Google Analytics functionality in the sidebar.
          Specify the slug field that is used for URL generation in your application. Optionally,
          specify a prefix for the slug.
        </Paragraph>
      </div>
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
