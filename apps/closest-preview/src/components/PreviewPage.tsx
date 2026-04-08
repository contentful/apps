import { Box, Heading, Paragraph, SectionHeading } from '@contentful/f36-components';

const getSearchParam = (name: string) => {
  const value = new URLSearchParams(window.location.search).get(name);
  return value?.trim() || '';
};

const PreviewPage = () => {
  const title = getSearchParam('title') || 'Untitled preview';
  const url = getSearchParam('url') || '/missing-url';
  const entryId = getSearchParam('entryId');

  return (
    <Box
      padding="spacing2Xl"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(246,247,249,1) 0%, rgba(255,255,255,1) 100%)',
      }}>
      <Box
        style={{
          maxWidth: 860,
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #d3dce0',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 12px 32px rgba(20, 38, 46, 0.08)',
        }}>
        <Paragraph marginBottom="spacingS">Closest Preview local preview target</Paragraph>
        <Heading marginBottom="spacingL">{title}</Heading>

        <SectionHeading>Resolved URL</SectionHeading>
        <Paragraph marginBottom="spacingL">
          <code>{url}</code>
        </Paragraph>

        {entryId && (
          <>
            <SectionHeading>Entry ID</SectionHeading>
            <Paragraph marginBottom="spacingL">
              <code>{entryId}</code>
            </Paragraph>
          </>
        )}

        <SectionHeading>What This Page Is For</SectionHeading>
        <Paragraph marginBottom="spacingM">
          This is a lightweight preview surface for configuring Contentful content preview against
          the Closest Preview development app.
        </Paragraph>
        <Paragraph>
          Once native content preview is configured for the content type, Contentful can open this
          page as the preview destination while we continue iterating on the `url`-based page
          detection flow.
        </Paragraph>
      </Box>
    </Box>
  );
};

export default PreviewPage;
