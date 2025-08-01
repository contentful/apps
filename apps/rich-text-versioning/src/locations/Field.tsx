import { FieldAppSDK } from '@contentful/app-sdk';
import { Paragraph, Stack, Heading, Note, Text, Card, Flex } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState, useEffect } from 'react';
import PublishedEntryViewer from '../components/PublishedEntryViewer';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();
  const [showPublishedData, setShowPublishedData] = useState(false);
  const [cdaToken, setCdaToken] = useState<string>('');

  // Get the current entry ID from the SDK
  const entryId = sdk.ids.entry;
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;

  useEffect(() => {
    // Initialize field value if it's undefined
    if (sdk.field.getValue() === undefined) {
      sdk.field.setValue({
        nodeType: 'document',
        data: {},
        content: [],
      });
    }
  }, [sdk.field]);

  useEffect(() => {
    // You would typically get the CDA token from app parameters or environment
    // For demo purposes, you might want to add this to your app configuration
    const token = 'lyM24A412WTMUxrD85eezmxX93075npm8pBlvl7s0qs';
    setCdaToken(token);
  }, []);

  const handleTogglePublishedData = () => {
    setShowPublishedData(!showPublishedData);
  };

  return (
    <Flex flexDirection="column" gap="spacingM">
      {!cdaToken && (
        <Note variant="warning">
          <Paragraph>
            CDA token not configured. Add REACT_APP_CDA_TOKEN to your environment variables to view
            published entry data.
          </Paragraph>
        </Note>
      )}
      <RichTextEditor sdk={sdk} isInitiallyDisabled={false} />
      <Card>
        <Text>{documentToHtmlString(sdk.field.getValue())}</Text>
      </Card>

      {cdaToken && (
        <div>
          <button
            onClick={handleTogglePublishedData}
            style={{
              background: showPublishedData ? '#e3f2fd' : '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}>
            {showPublishedData ? 'Hide' : 'Show'} Published Entry Data
          </button>

          {showPublishedData && (
            <PublishedEntryViewer
              entryId={entryId}
              spaceId={spaceId}
              environmentId={environmentId}
              accessToken={cdaToken}
              locale={sdk.locales.default}
            />
          )}
        </div>
      )}
    </Flex>
  );
};

export default Field;
