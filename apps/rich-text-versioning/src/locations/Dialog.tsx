import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  Box,
  Subheading,
  EntryCard,
  InlineEntryCard,
  Skeleton,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES } from '@contentful/rich-text-types';
import { useState, useEffect } from 'react';
import { styles } from './Dialog.styles';
import HtmlDiffViewer from '../components/HtmlDiffViewer';

interface InvocationParameters {
  currentField: Document;
  publishedField: Document;
}

const BLOCK_ENTRY_NODE_TYPE = 'embedded-entry-block';
const INLINE_ENTRY_NODE_TYPE = 'embedded-entry-inline';
const UNTITLED = 'Untitled';
const UNKNOWN = 'Unknown';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParameters;
  const [changeCount, setChangeCount] = useState(0);
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});
  const [entryContentTypes, setEntryContentTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField;

  // Fetch references from both current and published fields
  useEffect(() => {
    const fetchReferences = async () => {
      setLoading(true);
      const titles: Record<string, string> = {};
      const contentTypes: Record<string, string> = {};

      const extractEntryIds = (doc: Document): string[] => {
        const ids: string[] = [];
        const traverse = (node: any) => {
          if (node.nodeType === BLOCK_ENTRY_NODE_TYPE || node.nodeType === INLINE_ENTRY_NODE_TYPE) {
            ids.push(node.data.target.sys.id);
          }
          if (node.content) {
            node.content.forEach(traverse);
          }
        };
        doc.content?.forEach(traverse);
        return ids;
      };

      // Get entry IDs from both current and published fields
      const currentEntryIds = extractEntryIds(currentField);
      const publishedEntryIds = extractEntryIds(publishedField);
      const allEntryIds = [...new Set([...currentEntryIds, ...publishedEntryIds])];

      // Fetch titles and content types for each reference
      for (const entryId of allEntryIds) {
        try {
          const entry = await sdk.cma.entry.get({ entryId });
          const title = entry.fields?.name?.['en-US'] || entry.fields?.title?.['en-US'] || UNTITLED;
          const contentType = entry.sys.contentType?.sys?.id || UNKNOWN;
          titles[entryId] = title;
          contentTypes[entryId] = contentType;
        } catch (error) {
          titles[entryId] = UNTITLED;
          contentTypes[entryId] = UNKNOWN;
        }
      }

      setEntryTitles(titles);
      setEntryContentTypes(contentTypes);
      setLoading(false);
    };

    if (currentField && publishedField) {
      fetchReferences();
    }
  }, [currentField, publishedField, sdk.cma.entry]);

  const options = {
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        return (
          <EntryCard
            contentType={entry.sys.contentType.sys.id}
            size="small"
            title={entry.fields.title}
          />
        );
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        return (
          <InlineEntryCard contentType={entry.sys.contentType.sys.id} title={entry.fields.title}>
            {entry.fields.title}
          </InlineEntryCard>
        );
      },
    },
  };
  if (loading) {
    return (
      <Flex margin="spacingM">
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={4} />
        </Skeleton.Container>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" className={styles}>
      <Grid
        columns="1fr 1fr"
        rows="1"
        marginTop="spacingM"
        marginLeft="spacingM"
        marginRight="spacingM">
        <GridItem className="grid-item">
          <Flex alignItems="space-between">
            <Subheading>Current version</Subheading>
            <Badge variant="secondary" className="change-badge">
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </Badge>
          </Flex>
          {publishedField && !loading && (
            <HtmlDiffViewer
              currentField={currentField}
              publishedField={publishedField}
              onChangeCount={setChangeCount}
              entryTitles={entryTitles}
              entryContentTypes={entryContentTypes}
            />
          )}
        </GridItem>
        <GridItem className="grid-item">
          <Subheading>Published version</Subheading>
          <Box className="diff">{documentToReactComponents(publishedField, options)}</Box>
        </GridItem>
      </Grid>
      <Flex justifyContent="flex-end" margin="spacingM">
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            sdk.close();
          }}>
          Close
        </Button>
      </Flex>
    </Flex>
  );
};

export default Dialog;
