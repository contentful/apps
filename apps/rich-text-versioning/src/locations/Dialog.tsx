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
  const [entriesFromPublished, setEntriesFromPublished] = useState<EntryProps[]>([]);
  const [entriesFromCurrent, setEntriesFromCurrent] = useState<EntryProps[]>([]);
  const [entryContentTypes, setEntryContentTypes] = useState<ContentTypeProps[]>([]);
  const [assetsFromPublished, setAssetsFromPublished] = useState<AssetProps[]>([]);
  const [assetsFromCurrent, setAssetsFromCurrent] = useState<AssetProps[]>([]);
  const [loading, setLoading] = useState(true);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField || { content: [] };
  const locale = invocationParams?.locale;

  const getReferenceIdsFromDocument = (doc: Document, types: string[]): Set<string> => {
    const ids: Set<string> = new Set();
    const getEntryIdsFromNode = (node: any) => {
      if (types.includes(node.nodeType)) {
        ids.add(node.data.target.sys.id);
      }
      if ('content' in node) {
        node.content.forEach(getEntryIdsFromNode);
      }
    };
    doc.content?.forEach(getEntryIdsFromNode);
    return ids;
  };

  const getAssets = async (assetIds: string[]): Promise<AssetProps[]> => {
    if (assetIds.length === 0) return [];

    try {
      const fetchedAssets = await sdk.cma.asset.getMany({
        query: {
          select: 'sys.id,fields.title',
          'sys.id[in]': assetIds.join(','),
        },
      });
      return fetchedAssets.items;
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  };

  const getEntries = async (entryIds: string[]): Promise<EntryProps[]> => {
    if (entryIds.length === 0) return [];

    try {
      const fetchedEntries = await sdk.cma.entry.getMany({
        query: {
          'sys.id[in]': entryIds.join(','),
        },
      });
      return fetchedEntries.items;
    } catch (error) {
      console.error('Error fetching entries:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchReferences = async () => {
      setLoading(true);

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

      if (currentEntryIds.size > 0 || publishedEntryIds.size > 0) {
        const fetchedEntriesFromCurrent = await getEntries(Array.from(currentEntryIds));
        const fetchedEntriesFromPublished = await getEntries(Array.from(publishedEntryIds));
        setEntriesFromCurrent(fetchedEntriesFromCurrent);
        setEntriesFromPublished(fetchedEntriesFromPublished);

        try {
          const allEntries = [...entriesFromCurrent, ...entriesFromPublished];
          const fetchedContentTypes = await sdk.cma.contentType.getMany({
            query: {
              'sys.id[in]': allEntries.map((entry) => entry.sys.contentType.sys.id),
            },
          });
          setEntryContentTypes(fetchedContentTypes.items);
        } catch (error) {
          console.error('Error fetching content types:', error);
        }
      }
      if (publishedAssetIds.size > 0 || currentAssetIds.size > 0) {
        const fetchedAssetsFromPublished = await getAssets(Array.from(publishedAssetIds));
        const fetchedAssetsFromCurrent = await getAssets(Array.from(currentAssetIds));

        setAssetsFromPublished(fetchedAssetsFromPublished);
        setAssetsFromCurrent(fetchedAssetsFromCurrent);
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
              entriesFromPublished={entriesFromPublished}
              entriesFromCurrent={entriesFromCurrent}
              entryContentTypes={entryContentTypes}
              locale={sdk.locales.default}
              assetsFromPublished={assetsFromPublished}
              assetsFromCurrent={assetsFromCurrent}
            />
          )}
        </GridItem>
        <GridItem className={styles.gridItem}>
          <Subheading>Published version</Subheading>
          <Box className={styles.diff}>
            {documentToReactComponents(
              publishedField,
              createOptions(entriesFromPublished, entryContentTypes, assetsFromPublished, locale)
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
