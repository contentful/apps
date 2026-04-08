import { useCallback, useState, useEffect, useMemo } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex, Box, FormControl, Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import PreviewFieldMultiSelect from '../components/PreviewFieldMultiSelect';
import { AppInstallationParameters, ContentType } from '../types';
import { styles } from './ConfigScreen.styles';
import {
  DEFAULT_PREVIEW_FIELD_IDS,
  getContentTypeIdsWithPreviewFields,
  normalizePreviewFieldIds,
} from '../utils/livePreviewUtils';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [selectedPreviewFieldIds, setSelectedPreviewFieldIds] =
    useState<string[]>(DEFAULT_PREVIEW_FIELD_IDS);
  const [excludedContentTypeIds, setExcludedContentTypeIds] = useState<string[]>([]);
  const normalizedPreviewFieldIds = useMemo(
    () => normalizePreviewFieldIds(selectedPreviewFieldIds),
    [selectedPreviewFieldIds]
  );

  const onConfigure = useCallback(async () => {
    const assignableContentTypes = selectedContentTypes.filter(
      (contentType) => !excludedContentTypeIds.includes(contentType.id)
    );
    const editorInterface = assignableContentTypes.reduce(
      (acc, contentType) => ({
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      }),
      {}
    );

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: {
        previewFieldIds: normalizedPreviewFieldIds,
      } satisfies AppInstallationParameters,
      targetState: {
        ...currentState,
        EditorInterface: editorInterface,
      },
    };
  }, [excludedContentTypeIds, normalizedPreviewFieldIds, sdk, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setSelectedPreviewFieldIds(normalizePreviewFieldIds(currentParameters.previewFieldIds));
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    (async () => {
      const nextExcludedContentTypeIds = await getContentTypeIdsWithPreviewFields(
        sdk.cma,
        normalizedPreviewFieldIds
      );
      setExcludedContentTypeIds(nextExcludedContentTypeIds);
    })();
  }, [normalizedPreviewFieldIds, sdk.cma]);

  return (
    <Flex justifyContent="center" alignItems="center">
      <Box margin="spacing2Xl" className={styles.body}>
        <Form>
          <Heading as="h2" marginBottom="spacingS">
            Set up Closest Preview
          </Heading>
          <Paragraph marginBottom="spacingXl">
            Closest Preview allows users to quickly navigate to the closest page level element for a
            given entry in order to preview the item.
          </Paragraph>

          <Box marginBottom="spacing2Xl">
            <Heading as="h3" marginBottom="spacingXs">
              Assign content types
            </Heading>
            <Paragraph marginBottom="spacingL">
              Select the content type(s) you want to use with Closest Preview. You can change this
              anytime by navigating to the 'Sidebar' tab in your content model.
            </Paragraph>
            <FormControl id="contentTypes">
              <FormControl.Label>Content types</FormControl.Label>
              <ContentTypeMultiSelect
                selectedContentTypes={selectedContentTypes}
                setSelectedContentTypes={setSelectedContentTypes}
                sdk={sdk}
                cma={sdk.cma}
                excludedContentTypesIds={excludedContentTypeIds}
              />
            </FormControl>
          </Box>
          <Box marginBottom="spacing2Xl">
            <Heading as="h3" marginBottom="spacingXs">
              Preview field IDs
            </Heading>
            <Paragraph marginBottom="spacingL">
              Entries are treated as previewable pages when they contain one of these field IDs with
              a value in the default locale.
            </Paragraph>
            <FormControl id="previewFieldIds">
              <FormControl.Label>Field IDs</FormControl.Label>
              <PreviewFieldMultiSelect
                selectedContentTypes={selectedContentTypes}
                selectedPreviewFieldIds={normalizedPreviewFieldIds}
                setSelectedPreviewFieldIds={setSelectedPreviewFieldIds}
                cma={sdk.cma}
              />
              <FormControl.HelpText>
                Choose one or more field IDs from the selected content types. Duplicate field IDs
                are only shown once.
              </FormControl.HelpText>
            </FormControl>
          </Box>
          <Note variant="neutral">
            Content types with one of these preview field IDs are treated as page-level entries and
            excluded from the sidebar assignment list.
          </Note>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
