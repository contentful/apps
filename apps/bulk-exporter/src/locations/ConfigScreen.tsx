import { useEffect } from 'react';
import {
  Heading,
  Paragraph,
  Note,
  Flex,
  Box,
  List,
  SectionHeading,
  Text,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const fullWidth = { width: '100%' };

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
    <Box padding="spacingXl" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Flex flexDirection="column" gap="spacingXl" alignItems="stretch">
        <Flex flexDirection="column" gap="spacingS" alignItems="flex-start" style={fullWidth}>
          <Heading>Content Exporter</Heading>
          <Paragraph>
            Export entries from Contentful with filters, saved field selections, and multiple file
            formats. No additional configuration is required before installation.
          </Paragraph>
        </Flex>

        <Note variant="positive" title="Ready to install">
          Content Exporter adds a page to the Apps menu. After installation, users with access to this
          space can open the page and export entries from the content types they are allowed to
          read.
        </Note>

        <Flex flexDirection="column" gap="spacingL" alignItems="stretch" style={fullWidth}>
          <Box style={fullWidth}>
            <SectionHeading>How exports work</SectionHeading>
            <Paragraph marginBottom="spacingS">
              The app uses the Content Management API to paginate through matching entries and build
              a downloadable file in the browser.
            </Paragraph>
            <List>
              <List.Item>Export one content type or search across all content types.</List.Item>
              <List.Item>Preview matching entries before creating the export file.</List.Item>
              <List.Item>
                Select individual entries when only a subset should be exported.
              </List.Item>
            </List>
          </Box>

          <Box style={fullWidth}>
            <SectionHeading>Available controls</SectionHeading>
            <Paragraph marginBottom="spacingS">
              Users can narrow exports with the same content structure already available in the
              space.
            </Paragraph>
            <List>
              <List.Item>Status, tag, taxonomy, date range, and field-level filters.</List.Item>
              <List.Item>Locale selection for localized content.</List.Item>
              <List.Item>Field presets, custom field selection, and column ordering.</List.Item>
              <List.Item>CSV, JSON, XLSX, XML, and YAML downloads.</List.Item>
            </List>
          </Box>

          <Box style={fullWidth}>
            <SectionHeading>Before exporting</SectionHeading>
            <Paragraph marginBottom="spacingS">
              Large exports can take several minutes depending on entry count, selected fields, and
              API rate limits.
            </Paragraph>
            <List>
              <List.Item>Keep this browser tab open while an export is running.</List.Item>
              <List.Item>Use filters or date ranges to reduce very large exports.</List.Item>
              <List.Item>Verify the preview results before downloading production data.</List.Item>
            </List>
          </Box>
        </Flex>

        <Note variant="primary" title="Permissions">
          <Flex flexDirection="column" gap="spacingXs" alignItems="flex-start" style={fullWidth}>
            <Text>
              Content Exporter can only export entries, tags, locales, and taxonomy data that the
              current user is allowed to access.
            </Text>
            <Text>
              If a user cannot load content types or entries, review their space role and app
              access.
            </Text>
          </Flex>
        </Note>
      </Flex>
    </Box>
  );
};

export default ConfigScreen;
