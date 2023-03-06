import { useCallback, useEffect, useState } from 'react';
import { Paragraph, Stack, Subheading } from '@contentful/f36-components';
import {
  AppInstallationParameters,
  ContentTypeEntries,
  ContentTypeEntry,
  AllContentTypes,
} from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import omitBy from 'lodash/omitBy';
import sortBy from 'lodash/sortBy';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { ContentTypeProps, createClient } from 'contentful-management';

const AssignContentTypePage = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>(
    {} as AppInstallationParameters
  );
  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);
  const [contentTypeEntries, setContentTypeEntries] = useState<ContentTypeEntries>(
    {} as ContentTypeEntries
  );

  const sdk = useSDK<AppExtensionSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const newParameters = Object.assign(
      {},
      parameters,
      omitBy(
        {
          contentTypes: contentTypeEntries,
        },
        (val) => val === null
      )
    );

    setParameters(newParameters);

    return {
      parameters: newParameters,
      targetState: currentState,
    };
  }, [contentTypeEntries, parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const setupAppInstallationParameters = async () => {
      const currentParameters: AppInstallationParameters =
        (await sdk.app.getParameters()) ?? ({} as AppInstallationParameters);

      if (currentParameters) {
        setParameters(currentParameters);
        if (currentParameters?.contentTypes) {
          setContentTypeEntries(currentParameters.contentTypes);
        }
      }

      sdk.app.setReady();
    };

    setupAppInstallationParameters();
  }, [sdk]);

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

  const handleContentTypeChange = (prevKey: string, newKey: string) => {
    const newContentTypes: ContentTypeEntries = {};

    for (const [prop, value] of Object.entries(contentTypeEntries)) {
      if (prop === prevKey) {
        newContentTypes[newKey as keyof typeof contentTypeEntries] = {
          slugField: '',
          urlPrefix: value.urlPrefix,
        };
      } else {
        newContentTypes[prop] = value;
      }
    }

    setContentTypeEntries(newContentTypes);
  };

  const handleContentTypeFieldChange = (key: string, field: string, value: string) => {
    const currentContentTypeFields: ContentTypeEntry = contentTypeEntries[key];

    setContentTypeEntries({
      ...contentTypeEntries,
      [key]: {
        ...currentContentTypeFields,
        [field]: value,
      },
    });
  };

  const handleAddContentType = () => {
    setContentTypeEntries({
      ...contentTypeEntries,
      '': { slugField: '', urlPrefix: '' },
    });
  };

  const handleRemoveContentType = (key: string) => {
    const updatedContentTypeEntries = { ...contentTypeEntries };
    delete updatedContentTypeEntries[key];

    setContentTypeEntries(updatedContentTypeEntries);
  };

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
