import {
  Box,
  List,
  Paragraph,
  RelativeDateTime,
  Skeleton,
  TextLink,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps, QueryOptions } from 'contentful-management';
import { useCallback, useEffect, useState } from 'react';

const MAX_DEPTH = 5;

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  const getUpstreamEntries = useCallback(
    async (id: string): Promise<EntryProps[]> => {
      const rootEntryData: EntryProps[] = [];
      let childEntries: EntryProps[] = [];
      const checkedEntries: Set<string> = new Set([id]);
      let depth = 0;
      const maxDepth = MAX_DEPTH;

      try {
        const initialEntry = await sdk.cma.entry.get({
          entryId: id,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });
        childEntries = [initialEntry];
      } catch (error) {
        console.error('Failed to fetch initial entry:', error);
        return [];
      }

      while (childEntries.length > 0 && depth < maxDepth) {
        const relatedEntries = await Promise.all(
          childEntries.map((entry) => getRelatedEntries(entry.sys.id))
        );

        childEntries = relatedEntries.flatMap((rEntry) =>
          rEntry.filter((item: EntryProps) => {
            if (item && item.sys.id && !checkedEntries.has(item.sys.id)) {
              checkedEntries.add(item.sys.id);
              const slug = item.fields.slug?.[defaultLocale];
              if (slug) {
                rootEntryData.push(item);
                return false;
              }
              return true;
            }
            return false;
          })
        );

        depth++;
      }

      if (depth >= maxDepth && rootEntryData.length === 0) {
        console.log(`Max depth of ${maxDepth} reached for entry ID: ${id}`);
      }

      return rootEntryData;
    },
    [getRelatedEntries, sdk.ids.space, sdk.ids.environment, defaultLocale]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const rootEntries = await getUpstreamEntries(sdk.ids.entry);

      setEntries(rootEntries);
      setIsLoading(false);
    };
    fetchData();
  }, [getUpstreamEntries, sdk.ids.entry]);

  if (isLoading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={3} />
      </Skeleton.Container>
    );
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
