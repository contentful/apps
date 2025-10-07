import {
  Box,
  List,
  Paragraph,
  RelativeDateTime,
  Skeleton,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps, KeyValueMap } from 'contentful-management';
import { useCallback, useEffect, useState } from 'react';

const MAX_DEPTH = 10;

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [maxDepthReached, setMaxDepthReached] = useState<boolean>(false);
  const defaultLocale = sdk.locales.default;

  const getRelatedEntries = useCallback(
    async (id: string): Promise<EntryProps[]> => {
      try {
        const response = await sdk.cma.entry.getMany({
          query: {
            links_to_entry: id,
            order: '-sys.updatedAt',
            limit: 5,
          },
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        return response.items;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [sdk.ids.space, sdk.ids.environment]
  );

  const splitEntriesFromRoot = (
    entry: EntryProps<KeyValueMap>,
    checkedEntries: Set<string>,
    rootEntryData: EntryProps[]
  ) => {
    const entryId = entry?.sys?.id;
    if (!entryId || checkedEntries.has(entryId)) {
      return false;
    }

    checkedEntries.add(entryId);
    const slug = entry.fields.slug?.[defaultLocale];
    if (slug) {
      rootEntryData.push(entry);
      return false;
    }

    return true;
  };

  const getRootEntries = useCallback(
    async (id: string): Promise<{ entries: EntryProps[]; maxDepthReached: boolean }> => {
      const rootEntryData: EntryProps[] = [];
      let childEntries: EntryProps[] = [];
      const checkedEntries: Set<string> = new Set([id]);
      let depth = 0;
      const maxDepth = MAX_DEPTH;
      let depthReached = false;

      try {
        const initialEntry = await sdk.cma.entry.get({
          entryId: id,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });
        childEntries = [initialEntry];
      } catch (error) {
        console.error('Failed to fetch initial entry:', error);
        return { entries: [], maxDepthReached: false };
      }

      while (childEntries.length > 0 && depth < maxDepth) {
        const relatedEntries = await Promise.all(
          childEntries.map((entry) => getRelatedEntries(entry.sys.id))
        );

        childEntries = relatedEntries.flatMap((rEntry) =>
          rEntry.filter((item: EntryProps) => {
            return splitEntriesFromRoot(item, checkedEntries, rootEntryData);
          })
        );

        depth++;
      }

      if (depth >= maxDepth && rootEntryData.length === 0) {
        depthReached = true;
      }

      return { entries: rootEntryData, maxDepthReached: depthReached };
    },
    [getRelatedEntries, sdk.ids.space, sdk.ids.environment, defaultLocale]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await getRootEntries(sdk.ids.entry);

      setEntries(result.entries);
      setMaxDepthReached(result.maxDepthReached);
      setIsLoading(false);
    };
    fetchData();
  }, [getRootEntries, sdk.ids.entry]);

  if (isLoading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={3} />
      </Skeleton.Container>
    );
  }

  if (maxDepthReached) {
    return <Text>Max depth of {MAX_DEPTH} reached for entry.</Text>;
  }

  return (
    <List>
      {entries.map((entry: EntryProps) => {
        const entryLink = `https://${sdk.hostnames.webapp}/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}/entries/${entry.sys.id}`;
        return (
          <Box key={entry.sys.id} marginBottom="spacingS">
            <List.Item key={entry.sys.id}>
              <TextLink
                href={entryLink}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ArrowSquareOutIcon />}
                alignIcon="end">
                {entry.fields.title?.[defaultLocale] || entry.sys.id.slice(0, 8)}
              </TextLink>
              <br />
              <Paragraph fontSize="fontSizeM" fontColor="gray500" fontWeight="fontWeightMedium">
                Updated <RelativeDateTime date={entry.sys.updatedAt} />
              </Paragraph>
            </List.Item>
          </Box>
        );
      })}
    </List>
  );
};

export default Sidebar;
