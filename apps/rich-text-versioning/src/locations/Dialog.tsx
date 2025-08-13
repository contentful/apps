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
import { ContentTypeProps, EntryProps } from 'contentful-management';

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
  const [entryContentTypes, setEntryContentTypes] = useState<Record<string, ContentTypeProps>>({});
  const [loading, setLoading] = useState(true);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField;

  // Fetch references from both current and published fields
  useEffect(() => {
    const fetchReferences = async () => {
      setLoading(true);
      const titles: Record<string, string> = {};
      const contentTypes: Record<string, ContentTypeProps> = {};

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

      if (allEntryIds.length > 0) {
        let entries: EntryProps[] = [];
        try {
          const fetchedEntries = await sdk.cma.entry.getMany({
            query: {
              'sys.id[in]': allEntryIds.join(','),
            },
          });
          entries.push(...fetchedEntries.items);
        } catch (error) {
          console.error('Error fetching entries:', error);
        }
        if (entries.length > 0) {
          // Use Promise.all to properly handle async operations
          await Promise.all(
            entries.map(async (entry) => {
              const entryId = entry.sys.id;
              const title =
                entry.fields?.name?.['en-US'] || entry.fields?.title?.['en-US'] || UNTITLED;

              try {
                const contentType = await sdk.cma.contentType.get({
                  contentTypeId: entry.sys.contentType.sys.id,
                });
                titles[entryId] = title;
                contentTypes[entryId] = contentType;
              } catch (error) {
                console.error(`Error fetching content type for entry ${entryId}:`, error);
                titles[entryId] = title;
                contentTypes[entryId] = { name: UNKNOWN } as ContentTypeProps;
              }
            })
          );
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
        const contentType = entryContentTypes[entry.sys.id];
        const contentTypeName = contentType?.name || UNKNOWN;
        const title = entryTitles[entry.sys.id] || UNTITLED;

        return <EntryCard contentType={contentTypeName} title={title} />;
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        const contentType = entryContentTypes[entry.sys.id];
        const contentTypeName = contentType?.name || UNKNOWN;
        const title = entryTitles[entry.sys.id] || UNTITLED;

        return (
          <InlineEntryCard contentType={contentTypeName} title={title}>
            {title}
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
