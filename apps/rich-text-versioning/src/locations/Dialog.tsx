import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  Box,
  Subheading,
  Skeleton,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Block, BLOCKS, Document, Inline, INLINES, Text } from '@contentful/rich-text-types';
import { useState, useEffect } from 'react';
import { styles } from './Dialog.styles';
import HtmlDiffViewer from '../components/HtmlDiffViewer';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { createOptions } from '../components/createOptions';

interface InvocationParameters {
  currentField: Document;
  publishedField: Document;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParameters;
  const [changeCount, setChangeCount] = useState(0);
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [entryContentTypes, setEntryContentTypes] = useState<Record<string, ContentTypeProps>>({});

  const [loading, setLoading] = useState(true);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField;

  const getEntryIdsFromDocument = (doc: Document): string[] => {
    const ids: string[] = [];
    const getEntryIdsFromNode = (node: Block | Inline | Text) => {
      if (node.nodeType === BLOCKS.EMBEDDED_ENTRY || node.nodeType === INLINES.EMBEDDED_ENTRY) {
        ids.push(node.data.target.sys.id);
      }
      if ('content' in node) {
        node.content.forEach(getEntryIdsFromNode);
      }
    };
    doc.content?.forEach(getEntryIdsFromNode);
    return ids;
  };

  useEffect(() => {
    const fetchReferences = async () => {
      setLoading(true);
      const contentTypes: Record<string, ContentTypeProps> = {};

      const currentEntryIds = getEntryIdsFromDocument(currentField);
      const publishedEntryIds = getEntryIdsFromDocument(publishedField);
      const allEntryIds = [...new Set([...currentEntryIds, ...publishedEntryIds])];

      if (allEntryIds.length > 0) {
        let entries: EntryProps[] = [];
        try {
          const fetchedEntries = await sdk.cma.entry.getMany({
            query: {
              'sys.id[in]': allEntryIds.join(','),
            },
          });
          entries = fetchedEntries.items;
          setEntries(entries);
        } catch (error) {
          entries = [];
          console.error('Error fetching entries:', error);
        }
        if (entries.length > 0) {
          // Use Promise.all to properly handle async operations
          await Promise.all(
            entries.map(async (entry) => {
              const entryId = entry.sys.id;
              try {
                const contentType = await sdk.cma.contentType.get({
                  contentTypeId: entry.sys.contentType.sys.id,
                });

                contentTypes[entryId] = contentType;
              } catch (error) {
                console.error(`Error fetching content type for entry ${entryId}:`, error);
                contentTypes[entryId] = { name: 'Reference is missing' } as ContentTypeProps;
              }
            })
          );
        }
      }
      setEntryContentTypes(contentTypes);
      setLoading(false);
    };

    if (currentField && publishedField) {
      fetchReferences();
    }
  }, [currentField, publishedField, sdk.cma.entry]);

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
              entries={entries}
              entryContentTypes={entryContentTypes}
              defaultLocale={sdk.locales.default}
            />
          )}
        </GridItem>
        <GridItem className="grid-item">
          <Subheading>Published version</Subheading>
          <Box className="diff">
            {documentToReactComponents(
              publishedField,
              createOptions(entries, entryContentTypes, sdk.locales.default)
            )}
          </Box>
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
