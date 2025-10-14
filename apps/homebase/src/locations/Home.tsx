import { HomeAppSDK } from '@contentful/app-sdk';
import { Box, Button, Flex, Menu, Paragraph } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { CONTENT_TYPE_ID, MARKDOWN_ID, TITLE_ID } from '../consts';
import { useEffect, useState } from 'react';
import { EntryProps } from 'contentful-management';
import MarkdownPreview from '../components/MarkdownPreview';
import { styles } from './Home.styles';
import Splitter from '../components/Splitter';
import tokens from '@contentful/f36-tokens';

const Home = () => {
  const sdk = useSDK<HomeAppSDK>();
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<EntryProps | null>(null);
  const defaultLocale = sdk.locales.default;

  useEffect(() => {
    const getEntries = async () => {
      const entries = await sdk.cma.entry.getMany({
        query: {
          'sys.contentType.sys.id': CONTENT_TYPE_ID,
        },
      });
      setEntries(entries.items);
      if (entries.items.length > 0) {
        setSelectedEntry(entries.items[0]);
      }
    };
    getEntries();
  }, []);

  if (!entries) {
    return <Paragraph>Loading...</Paragraph>;
  }

  return (
    <Flex flexDirection="column" marginLeft="spacingL" marginRight="spacingL" style={styles.home}>
      <Flex justifyContent="flex-end" marginTop="spacingS" marginRight="spacingS">
        <Menu>
          <Menu.Trigger>
            <Button>Select entry</Button>
          </Menu.Trigger>
          <Menu.List>
            {entries.map((entry) => (
              <Menu.Item key={entry.sys.id} onClick={() => setSelectedEntry(entry)}>
                {entry.fields[TITLE_ID]?.[defaultLocale]}
              </Menu.Item>
            ))}
          </Menu.List>
        </Menu>
      </Flex>
      <Box>
        <Splitter marginTop="spacingS" style={styles.splitter} data-test-id="splitter" />
      </Box>
      <Flex flexDirection="column">
        {selectedEntry && (
          <MarkdownPreview
            value={selectedEntry.fields[MARKDOWN_ID]?.[defaultLocale] || ''}
            mode={'fullPage'}
            direction={sdk.locales.direction[defaultLocale]}
            data-testid="markdown-preview"
          />
        )}
      </Flex>
    </Flex>
  );
};

export default Home;
