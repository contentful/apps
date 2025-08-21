import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  Subheading,
  Box,
  Note,
  Text,
  Skeleton,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES } from '@contentful/rich-text-types';
import { useState, useEffect } from 'react';
import { styles } from './Dialog.styles';
import HtmlDiffViewer from '../components/HtmlDiffViewer';
import { AssetProps, ContentTypeProps, EntryProps } from 'contentful-management';
import { createOptions } from '../components/createOptions';
import { ErrorInfo } from '../utils';

interface InvocationParameters {
  currentField: Document;
  publishedField: Document;
  errorInfo: ErrorInfo;
  locale: string;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParameters;
  const [changeCount, setChangeCount] = useState(0);
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [entryContentTypes, setEntryContentTypes] = useState<Record<string, ContentTypeProps>>({});
  const [assets, setAssets] = useState<AssetProps[]>([]);
  const [loading, setLoading] = useState(true);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField || { content: [] };
  const locale = invocationParams?.locale;

  const getReferenceIdsFromDocument = (doc: Document, types: string[]): string[] => {
    const ids: string[] = [];
    const getEntryIdsFromNode = (node: any) => {
      if (types.includes(node.nodeType)) {
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

      const currentEntryIds = getReferenceIdsFromDocument(currentField, [
        BLOCKS.EMBEDDED_ENTRY,
        INLINES.EMBEDDED_ENTRY,
      ]);
      const publishedEntryIds = getReferenceIdsFromDocument(publishedField, [
        BLOCKS.EMBEDDED_ENTRY,
        INLINES.EMBEDDED_ENTRY,
      ]);
      const currentAssetIds = getReferenceIdsFromDocument(currentField, [BLOCKS.EMBEDDED_ASSET]);
      const publishedAssetIds = getReferenceIdsFromDocument(publishedField, [
        BLOCKS.EMBEDDED_ASSET,
      ]);
      const allEntryIds = [...new Set([...currentEntryIds, ...publishedEntryIds])];
      const allAssetIds = [...new Set([...currentAssetIds, ...publishedAssetIds])];

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
        setEntryContentTypes(contentTypes);
      }
      if (allAssetIds.length > 0) {
        try {
          const fetchedAssets = await sdk.cma.asset.getMany({
            query: {
              'sys.id[in]': allAssetIds.join(','),
            },
          });
          setAssets(fetchedAssets.items);
        } catch (error) {
          console.error('Error fetching assets:', error);
        }
      }
      setLoading(false);
    };

    if (currentField || publishedField) {
      fetchReferences();
    }
  }, []);

  if (loading) {
    return (
      <Flex margin="spacingM">
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={4} />
        </Skeleton.Container>
      </Flex>
    );
  }
  const errorInfo = invocationParams?.errorInfo;

  if (errorInfo?.hasError) {
    return (
      <Flex className={styles.modalContent} flexDirection="column" justifyContent="space-between">
        <Note variant="negative">
          <Flex alignItems="center" gap="spacingS">
            <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
              Error loading content
            </Text>
          </Flex>
          <Text fontSize="fontSizeS">
            Error {errorInfo.errorCode} - {errorInfo.errorMessage}
          </Text>
        </Note>
        <Flex justifyContent="flex-end">
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
  }

  return (
    <Flex flexDirection="column">
      <Grid
        columns="1fr 1fr"
        rows="1"
        marginTop="spacingM"
        marginLeft="spacingM"
        marginRight="spacingM">
        <GridItem className={styles.gridItem}>
          <Flex alignItems="space-between">
            <Subheading>Current version</Subheading>
            <Badge variant="secondary" className={styles.changeBadge}>
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </Badge>
          </Flex>
          {(publishedField || currentField) && (
            <HtmlDiffViewer
              currentField={currentField}
              publishedField={publishedField}
              onChangeCount={setChangeCount}
              entries={entries}
              entryContentTypes={entryContentTypes}
              locale={sdk.locales.default}
              assets={assets}
            />
          )}
        </GridItem>
        <GridItem className={styles.gridItem}>
          <Subheading>Published version</Subheading>
          <Box className={styles.diff}>
            {documentToReactComponents(
              publishedField,
              createOptions(entries, entryContentTypes, assets, locale)
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
