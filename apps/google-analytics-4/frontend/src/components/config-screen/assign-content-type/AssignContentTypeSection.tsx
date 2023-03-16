import { useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading } from '@contentful/f36-components';
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
  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);
  const [allContentTypeEntries, setAllContentTypeEntries] = useState<AllContentTypeEntries>(
    [] as AllContentTypeEntries
  );
  const [hasContentTypes, setHasContentTypes] = useState<boolean>(false);
  const [contentTypeEntries, setHasContentTypeEntries] = useState<ContentTypeEntries>(
    [] as ContentTypeEntries
  );

  const sdk = useSDK<AppExtensionSDK>();

  useEffect(() => {
    if (parameters.contentTypes) onIsValidContentTypeAssignment(true);
  }, [onIsValidContentTypeAssignment, parameters.contentTypes]);

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

    setContentTypes(newContentTypes);
  };

  const handleContentTypeFieldChange = (key: string, field: string, value: string) => {
    const currentContentTypeFields: ContentTypeValue = contentTypes[key];

    setContentTypes({
      ...contentTypes,
      [key]: {
        ...currentContentTypeFields,
        [field]: value,
      },
    });
    const _parameters = { contentTypes: contentTypes };
    mergeSdkParameters(_parameters);
    onIsValidContentTypeAssignment(true);
  };

  const handleAddContentType = () => {
    setContentTypes({
      ...contentTypes,
      '': { slugField: '', urlPrefix: '' },
    });
  };

  const handleRemoveContentType = (key: string) => {
    const updatedContentTypes = { ...contentTypes };
    delete updatedContentTypes[key];

    setContentTypes(updatedContentTypes);
  };

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
    };

    getContentTypes();
  }, [sdk]);

  useEffect(() => {
    setHasContentTypes(Object.keys(contentTypes).length ? true : false);
    setHasContentTypeEntries(Object.entries(contentTypes));
  }, [contentTypes]);

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
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={contentTypes}
        hasContentTypes={hasContentTypes}
        contentTypeEntries={contentTypeEntries}
        onContentTypeChange={handleContentTypeChange}
        onContentTypeFieldChange={handleContentTypeFieldChange}
        onAddContentType={handleAddContentType}
        onRemoveContentType={handleRemoveContentType}
      />
    </Stack>
  );
};

export default AssignContentTypeSection;
