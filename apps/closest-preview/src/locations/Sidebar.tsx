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
import { EntryProps } from 'contentful-management';
import { useEffect, useState } from 'react';
import { getRootEntries } from '../utils/livePreviewUtils';
import { getContentTypesForEntries, getDisplayField } from '../utils/entryUtils';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contentTypes, setContentTypes] = useState<Record<string, any>>({});
  const defaultLocale = sdk.locales.default;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const entries = await getRootEntries(sdk);

      setEntries(entries);

      const contentTypeMap = await getContentTypesForEntries(sdk, entries);
      setContentTypes(contentTypeMap);

      setIsLoading(false);
    };
    fetchData();
  }, []);

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
                {getDisplayField(entry, contentTypes, defaultLocale)}
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
