import { Box, RelativeDateTime, TextLink, List, Paragraph } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { EntryProps } from 'contentful-management';
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const [entries, setEntries] = useState<EntryProps[]>([]);

  // TODO: use entries with Live Preview. Using any entries for now.
  useEffect(() => {
    const fetchEntries = async () => {
      const response = await sdk.cma.entry.getMany({});
      setEntries(response.items.slice(0, 5));
    };
    fetchEntries();
  }, []);

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
                {/* TODO: get the title of the entry */}
                {entry.sys.id.slice(0, 8)}
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
