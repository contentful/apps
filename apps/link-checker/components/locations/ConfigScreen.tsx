import React, { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  TextInput,
  Textarea,
} from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect from '@/components/ContentTypeMultiSelect';
import { styles } from './ConfigScreen.styles';

export interface AppInstallationParameters {
  /** Comma-separated production domain substrings to require for valid links. */
  allowedUrlPatterns?: string;
  /** Comma-separated non-production domain substrings to treat as invalid (deny list). */
  forbiddenUrlPatterns?: string;
  /** Base URL used to resolve relative links for checking. */
  baseUrl?: string;
}

export interface ContentTypeItem {
  id: string;
  name: string;
}

function ConfigScreen() {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [allContentTypes, setAllContentTypes] = useState<ContentTypeItem[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  const fetchAllContentTypes = useCallback(async (): Promise<ContentTypeItem[]> => {
    if (!cma?.contentType?.getMany) return [];

    const contentTypes: ContentTypeItem[] = [];
    let skip = 0;
    const limit = 1000;
    let fetched: number;

    do {
      const response = await cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      const items = (response.items ?? []) as { sys: { id: string }; name: string }[];

      items.forEach((contentType) => {
        contentTypes.push({ id: contentType.sys.id, name: contentType.name });
      });

      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return contentTypes.sort((a, b) => a.name.localeCompare(b.name));
  }, [cma, sdk.ids.environment, sdk.ids.space]);

  const loadContentTypesAndRestoreState = useCallback(async () => {
    try {
      setIsLoading(true);
      const contentTypes = await fetchAllContentTypes();
      setAllContentTypes(contentTypes);

      const currentState = (await sdk.app.getCurrentState()) as {
        EditorInterface?: Record<string, unknown>;
      } | null;

      if (currentState?.EditorInterface) {
        const selectedIds = Object.keys(currentState.EditorInterface);
        setSelectedContentTypes(contentTypes.filter((contentType) => selectedIds.includes(contentType.id)));
      }
    } catch (error) {
      console.error('Error loading content types:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllContentTypes, sdk.app]);

  const onConfigure = useCallback(async () => {
    const currentState = (await sdk.app.getCurrentState()) as {
      EditorInterface?: Record<
        string,
        { sidebar?: { position: number }; editors?: unknown; controls?: unknown }
      >;
    } | null;
    const currentEditorInterface = currentState?.EditorInterface ?? {};
    const newEditorInterface: Record<
      string,
      { sidebar?: { position: number }; editors?: unknown; controls?: unknown }
    > = {};

    Object.keys(currentEditorInterface).forEach((contentTypeId) => {
      if (selectedContentTypes.some((contentType) => contentType.id === contentTypeId)) {
        newEditorInterface[contentTypeId] = currentEditorInterface[contentTypeId];
      }
    });

    const sidebarPosition = 1;
    selectedContentTypes.forEach((contentType) => {
      if (!newEditorInterface[contentType.id]) {
        newEditorInterface[contentType.id] = { sidebar: { position: sidebarPosition } };
      }
    });

    return {
      parameters,
      targetState: {
        EditorInterface: newEditorInterface,
      } as {
        EditorInterface: Record<
          string,
          {
            sidebar?: { position: number };
            editors?: { position: number };
            controls?: { fieldId: string; settings?: Record<string, unknown> }[];
          }
        >;
      },
    };
  }, [parameters, selectedContentTypes, sdk.app]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [onConfigure, sdk.app]);

  useEffect(() => {
    (async () => {
      const currentParameters = (await sdk.app.getParameters()) as AppInstallationParameters | null;
      if (currentParameters) {
        setParameters(currentParameters);
      }

      await loadContentTypesAndRestoreState();
      sdk.app.setReady();
    })();
  }, [loadContentTypesAndRestoreState, sdk.app]);

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" marginTop="spacing2Xl">
        <Paragraph>Loading content types…</Paragraph>
      </Flex>
    );
  }

  return (
    <Flex justifyContent="center" marginTop="spacingL" marginLeft="spacingL" marginRight="spacingL">
      <Flex className={styles.container} flexDirection="column" alignItems="stretch">
        <Flex flexDirection="column" alignItems="flex-start">
          <Heading as="h1" marginBottom="spacingS">
            Link Checker
          </Heading>
          <Paragraph marginBottom="spacing2Xl">
            Configure where Link Checker appears and which URL rules it should enforce. Editors use
            the sidebar app to scan entry content for broken, blocked, or unexpected links before
            they publish.
          </Paragraph>
        </Flex>

        <Flex flexDirection="column" alignItems="stretch">
          <Heading as="h3" marginBottom="spacingXs">
            Configure access
          </Heading>
          <Paragraph marginBottom="spacingL">
            Set the current site domain used to resolve relative links before they are checked.
          </Paragraph>
          <Form style={{ width: '100%' }}>
            <FormControl>
              <FormControl.Label>Current domain</FormControl.Label>
              <TextInput
                value={parameters.baseUrl ?? ''}
                onChange={(event) =>
                  setParameters({ ...parameters, baseUrl: event.target.value })
                }
                placeholder="https://www.example.com"
              />
              <FormControl.HelpText>
                Optional. Relative links such as <code>/support</code> are resolved against this
                value before Link Checker validates them.
              </FormControl.HelpText>
            </FormControl>
          </Form>
        </Flex>

        <Flex flexDirection="column" alignItems="stretch" marginTop="spacing2Xl">
          <Heading as="h3" marginBottom="spacingXs">
            Assign content types
          </Heading>
          <Paragraph marginBottom="spacingL">
            Choose which content types should show the Link Checker sidebar app in the entry
            editor.
          </Paragraph>
          <FormControl id="contentTypes" style={{ width: '100%' }}>
            <FormControl.Label>Content types</FormControl.Label>
            <ContentTypeMultiSelect
              availableContentTypes={allContentTypes}
              selectedContentTypes={selectedContentTypes}
              onSelectionChange={setSelectedContentTypes}
              isDisabled={allContentTypes.length === 0}
            />
            <FormControl.HelpText>
              Installers can keep the app focused on the content models that need editorial link
              validation.
            </FormControl.HelpText>
          </FormControl>
        </Flex>

        <Form style={{ width: '100%', marginTop: 'var(--spacing-2xl)' }}>
          <Heading as="h3" marginBottom="spacingXs">
            Set up rules
          </Heading>
          <Paragraph marginBottom="spacingL">
            Define which domains editors should use and which ones should be flagged immediately.
          </Paragraph>
          <FormControl>
            <FormControl.Label>Allow list</FormControl.Label>
            <Textarea
              value={parameters.allowedUrlPatterns ?? ''}
              onChange={(event) =>
                setParameters({ ...parameters, allowedUrlPatterns: event.target.value })
              }
              placeholder="www.example.com, help.example.com"
              rows={3}
            />
            <FormControl.HelpText>
              Optional. When set, Link Checker marks any resolved URL that does not include one of
              these comma-separated patterns as invalid.
            </FormControl.HelpText>
          </FormControl>
          <FormControl marginTop="spacingM">
            <FormControl.Label>Deny list</FormControl.Label>
            <Textarea
              value={parameters.forbiddenUrlPatterns ?? ''}
              onChange={(event) =>
                setParameters({ ...parameters, forbiddenUrlPatterns: event.target.value })
              }
              placeholder="staging.example.com, test.example.com, dev.example.com"
              rows={3}
            />
            <FormControl.HelpText>
              Optional. Any comma-separated pattern listed here is always flagged as invalid, which
              is useful for blocking staging, QA, or other non-production domains.
            </FormControl.HelpText>
          </FormControl>
        </Form>

        <Flex flexDirection="column" alignItems="stretch" marginTop="spacing2Xl">
          <Heading as="h3" marginBottom="spacingXs">
            Disclaimer
          </Heading>
          <Paragraph marginBottom="spacingS">
            Link Checker relies on an App Function to make outbound HTTP requests, so the target
            space must support App Functions and the necessary network-access exception.
          </Paragraph>
          <Paragraph>
            That makes the app a strong fit for internal or carefully managed installations, and it
            should be reviewed accordingly before broader rollout.
          </Paragraph>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default ConfigScreen;
