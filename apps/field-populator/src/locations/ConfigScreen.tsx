import { ConfigAppSDK, AppState } from '@contentful/app-sdk';
import { Flex, Heading, Paragraph, FormControl } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { ContentTypeProps } from 'contentful-management';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { styles } from './ConfigScreen.styles';

export type AppInstallationParameters = Record<string, unknown>;

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sdk = useSDK<ConfigAppSDK>();

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    const contentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let fetched: number;

    do {
      const response = await sdk.cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      const items = response.items as ContentTypeProps[];
      contentTypes.push(...items);
      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return contentTypes.sort((a, b) => a.name.localeCompare(b.name));
  };

  const loadContentTypesAndRestoreState = async () => {
    try {
      setIsLoading(true);
      const contentTypes = await fetchAllContentTypes();
      setAllContentTypes(contentTypes);

      const currentState: AppState | null = await sdk.app.getCurrentState();
      if (currentState?.EditorInterface) {
        const selectedIds = Object.keys(currentState.EditorInterface);
        const restored = contentTypes.filter((ct) => selectedIds.includes(ct.sys.id));
        setSelectedContentTypes(restored);
      }
    } catch (error) {
      console.error('Error loading content types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    const currentEditorInterface = currentState?.EditorInterface || {};

    const newEditorInterface: AppState['EditorInterface'] = {};

    Object.keys(currentEditorInterface).forEach((contentTypeId) => {
      if (selectedContentTypes.some((ct) => ct.sys.id === contentTypeId)) {
        newEditorInterface[contentTypeId] = currentEditorInterface[contentTypeId];
      }
    });

    selectedContentTypes.forEach((contentType) => {
      if (!newEditorInterface[contentType.sys.id]) {
        newEditorInterface[contentType.sys.id] = {
          sidebar: { position: 1 },
        };
      }
    });

    return {
      parameters,
      targetState: {
        EditorInterface: newEditorInterface,
      },
    };
  }, [parameters, selectedContentTypes, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      await loadContentTypesAndRestoreState();
      sdk.app.setReady();
    })();
  }, [sdk]);

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center">
        <Paragraph>Loading content types...</Paragraph>
      </Flex>
    );
  }

  return (
    <Flex justifyContent="center" marginTop="spacingL" marginLeft="spacingL" marginRight="spacingL">
      <Flex className={styles.container} flexDirection="column" alignItems="flex-start">
        <Flex flexDirection="column" alignItems="flex-start">
          <Heading marginBottom="spacingS">Set up Field Populator</Heading>
          <Paragraph marginBottom="spacing2Xl">
            Save time localizing content by instantly copying field values across locales with the
            Field Populator app.
          </Paragraph>
        </Flex>
        <Flex flexDirection="column" alignItems="flex-start">
          <Heading as="h3" marginBottom="spacingXs">
            Assign content types
          </Heading>
          <Paragraph marginBottom="spacingL">
            {`Select the content type(s) you want to use with Field Populator. You can change this
            anytime by navigating to the 'Sidebar' tab in your content model.`}
          </Paragraph>
          <FormControl id="contentTypes" style={{ width: '100%' }}>
            <FormControl.Label>Content types</FormControl.Label>
            <ContentTypeMultiSelect
              availableContentTypes={allContentTypes}
              selectedContentTypes={selectedContentTypes}
              onSelectionChange={setSelectedContentTypes}
              isDisabled={allContentTypes.length === 0}
            />
          </FormControl>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
