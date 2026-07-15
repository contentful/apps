import { useEffect } from 'react';
import { Heading, Paragraph, Note, Flex, Box, List, Subheading } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    const configure = async () => {
      sdk.app.onConfigure(async () => {
        return {
          parameters: {},
          targetState: {
            EditorInterface: {},
          },
        };
      });

      sdk.app.setReady();
    };

    configure().catch((error) => {
      console.error('Configuration error:', error);
      sdk.notifier.error('Failed to initialize app configuration');
    });
  }, [sdk]);

  return (
    <Box padding="spacingXl" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Flex flexDirection="column" gap="spacingXl" alignItems="stretch">

        {/* Header */}
        <Flex flexDirection="column" gap="spacingS" alignItems="flex-start">
          <Heading>Content Exporter</Heading>
          <Paragraph marginBottom="none">
            Export entries from Contentful with filters, saved field selections, and multiple file
            formats. Once installed, it adds a page to the Apps menu where users can export entries
            from any content type they have read access to.
          </Paragraph>
        </Flex>

        {/* How it works */}
        <Flex flexDirection="column" gap="spacingM" alignItems="stretch">
          <Box>
            <Subheading>How it works</Subheading>
            <Paragraph marginBottom="spacingM">
              The app uses the Content Management API to paginate through matching entries and build
              a downloadable file in your browser.
            </Paragraph>
            <List>
              <List.Item>Export one content type, or search across all of them</List.Item>
              <List.Item>Preview matching entries before generating the file</List.Item>
              <List.Item>Select individual entries when only a subset is needed</List.Item>
              <List.Item>Filter by status, tag, taxonomy, date range, field values, or locale</List.Item>
              <List.Item>Choose specific fields to narrow down list</List.Item>
              <List.Item>Download as CSV, JSON, XLSX, XML, or YAML</List.Item>
            </List>
          </Box>

          {/* Before exporting */}
          <Box>
            <Subheading>Before exporting large datasets</Subheading>
            <Paragraph marginBottom="none">
              Big exports can take a few minutes depending on entry count and API rate limits. Keep
              the tab open while it runs, use filters to narrow large exports.
            </Paragraph>
          </Box>
        </Flex>

        {/* Permissions note */}
        <Note variant="primary" title="Permissions">
          Exports only include entries, tags, locales, and taxonomy data the current user can
          already access. If content types or entries fail to load, check the user's space role
          and app access.
        </Note>

      </Flex>
    </Box>
  );
};

export default ConfigScreen;
