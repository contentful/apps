import { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Heading,
  Flex,
  Button,
  Spinner,
  Note,
  Badge,
  Stack,
} from '@contentful/f36-components';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { CDAService, CDAEntry, ContentType } from '../services/cdaService';

interface PublishedEntryViewerProps {
  entryId: string;
  spaceId: string;
  environmentId: string;
  accessToken: string;
  locale?: string;
}

interface PublishedEntryViewerState {
  entry: CDAEntry | null;
  contentType: ContentType | null;
  loading: boolean;
  error: string | null;
  connectionValid: boolean | null;
}

const PublishedEntryViewer = ({
  entryId,
  spaceId,
  environmentId,
  accessToken,
  locale = 'en-US',
}: PublishedEntryViewerProps) => {
  const [state, setState] = useState<PublishedEntryViewerState>({
    entry: null,
    contentType: null,
    loading: false,
    error: null,
    connectionValid: null,
  });

  const cdaService = new CDAService(spaceId, environmentId, accessToken);

  const validateConnection = async () => {
    try {
      const result = await cdaService.validateConnection();
      setState((prev) => ({ ...prev, connectionValid: result.valid }));
      return result.valid;
    } catch (error) {
      setState((prev) => ({ ...prev, connectionValid: false }));
      return false;
    }
  };

  const fetchEntry = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // First validate the connection
      const isConnectionValid = await validateConnection();
      if (!isConnectionValid) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Unable to connect to Content Delivery API. Please check your configuration.',
        }));
        return;
      }

      const { entry, contentType } = await cdaService.getEntryWithContentType(entryId, locale);
      setState({ entry, contentType, loading: false, error: null, connectionValid: true });
    } catch (error) {
      setState({
        entry: null,
        contentType: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch entry',
        connectionValid: false,
      });
    }
  };

  useEffect(() => {
    if (entryId && spaceId && environmentId && accessToken) {
      fetchEntry();
    }
  }, [entryId, spaceId, environmentId, accessToken, locale]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isEntryPublished = (entry: CDAEntry): boolean => {
    return entry.sys.publishedVersion > 0;
  };

  const isRichTextDocument = (value: any): boolean => {
    return (
      value &&
      typeof value === 'object' &&
      value.nodeType === 'document' &&
      value.data &&
      value.content
    );
  };

  const renderFieldValue = (fieldName: string, fieldValue: any): React.ReactNode => {
    if (fieldValue === null || fieldValue === undefined) {
      return <Text>No value</Text>;
    }

    // Check if this is a rich text field based on content type
    const isRichTextField =
      state.contentType && cdaService.isRichTextField(fieldName, state.contentType);

    // Handle rich text documents
    if (isRichTextField || isRichTextDocument(fieldValue)) {
      try {
        const htmlString = documentToHtmlString(fieldValue);
        return (
          <div>
            <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>Rich Text Content:</Text>
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '12px',
                backgroundColor: '#f9f9f9',
                maxHeight: '200px',
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: htmlString }}
            />
            <Text style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              HTML Length: {htmlString.length} characters
            </Text>
            {isRichTextField && (
              <Badge variant="primary" style={{ marginTop: '4px' }}>
                Rich Text Field
              </Badge>
            )}
          </div>
        );
      } catch (error) {
        console.error('Error converting rich text to HTML:', error);
        return <Text style={{ color: 'red' }}>Error converting rich text content</Text>;
      }
    }
  };

  if (state.loading) {
    return (
      <Card>
        <Flex justifyContent="center" padding="spacingL">
          <Spinner size="medium" />
          <Text>Loading published entry...</Text>
        </Flex>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card>
        <Note variant="negative">
          <Heading>Error Loading Entry</Heading>
          <Text>{state.error}</Text>
          <Stack spacing="spacingS" marginTop="spacingM">
            <Text style={{ fontSize: '14px' }}>
              <strong>Entry ID:</strong> {entryId}
            </Text>
            <Text style={{ fontSize: '14px' }}>
              <strong>Space ID:</strong> {spaceId}
            </Text>
            <Text style={{ fontSize: '14px' }}>
              <strong>Environment ID:</strong> {environmentId}
            </Text>
            <Text style={{ fontSize: '14px' }}>
              <strong>Locale:</strong> {locale}
            </Text>
          </Stack>
          <div style={{ marginTop: '16px' }}>
            <Button onClick={fetchEntry} variant="secondary" size="small">
              Retry
            </Button>
          </div>
        </Note>
      </Card>
    );
  }

  if (!state.entry) {
    return (
      <Card>
        <Note variant="warning">
          <Text>No entry data available</Text>
        </Note>
      </Card>
    );
  }

  // Check if entry is published
  if (!isEntryPublished(state.entry)) {
    return (
      <Card>
        <Note variant="warning">
          <Heading>Entry is not published</Heading>
          <Text>
            This entry is currently in draft status and has not been published yet. Published data
            will be available once the entry is published.
          </Text>
          <Stack spacing="spacingS" marginTop="spacingM">
            <Text style={{ fontSize: '14px' }}>
              <strong>Entry ID:</strong> {state.entry.sys.id}
            </Text>
            <Text style={{ fontSize: '14px' }}>
              <strong>Content Type:</strong> {state.entry.sys.contentType.sys.id}
            </Text>
            <Text style={{ fontSize: '14px' }}>
              <strong>Created:</strong> {formatDate(state.entry.sys.createdAt)}
            </Text>
            <Text style={{ fontSize: '14px' }}>
              <strong>Last Updated:</strong> {formatDate(state.entry.sys.updatedAt)}
            </Text>
          </Stack>
          <div style={{ marginTop: '16px' }}>
            <Button onClick={fetchEntry} variant="secondary" size="small">
              Check Again
            </Button>
          </div>
        </Note>
      </Card>
    );
  }

  return (
    <Card>
      <Stack spacing="spacingL">
        {Object.entries(state.entry.fields).map(([fieldName, fieldValue]) => {
          // Only render rich text fields
          const isRichTextField =
            state.contentType && cdaService.isRichTextField(fieldName, state.contentType);
          const isRichTextDoc = isRichTextDocument(fieldValue);

          if (!isRichTextField && !isRichTextDoc) {
            return null;
          }

          try {
            const htmlString = documentToHtmlString(fieldValue);
            return (
              <div key={fieldName}>
                <div
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px',
                    backgroundColor: '#f9f9f9',
                  }}>
                  {htmlString}
                </div>
              </div>
            );
          } catch (error) {
            return (
              <div key={fieldName}>
                <Text style={{ fontWeight: 'bold' }}>{fieldName}:</Text>
                <Text style={{ color: 'red' }}>Error converting rich text content</Text>
              </div>
            );
          }
        })}

        <Button onClick={fetchEntry} variant="secondary" size="small">
          Refresh Data
        </Button>
      </Stack>
    </Card>
  );
};

export default PublishedEntryViewer;
