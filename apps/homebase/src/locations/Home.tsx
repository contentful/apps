import { HomeAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Card,
  Flex,
  Menu,
  Paragraph,
  SkeletonRow,
  Text,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { CONTENT_TYPE_ID, MARKDOWN_ID, TITLE_ID } from '../consts';
import { useEffect, useState } from 'react';
import { EntryProps } from 'contentful-management';
import MarkdownPreview from '../components/MarkdownPreview';
import { styles } from './Home.styles';
import Splitter from '../components/Splitter';
import ButtonMenu from '../components/ButonMenu';

const Home = () => {
  const sdk = useSDK<HomeAppSDK>();
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<EntryProps | null>(null);
  const [loading, setLoading] = useState(true);
  const defaultLocale = sdk.locales.default;

  useEffect(() => {
    const getEntries = async () => {
      setLoading(true);
      const entries = await sdk.cma.entry.getMany({
        query: {
          'sys.contentType.sys.id': CONTENT_TYPE_ID,
        },
      });
      setEntries(entries.items);
      if (entries.items.length > 0) {
        setSelectedEntry(entries.items[0]);
      }
      setLoading(false);
    };
    getEntries();
  }, []);

  const handleCreateEntry = async () => {
    await sdk.navigator.openNewEntry(CONTENT_TYPE_ID, {
      slideIn: {
        waitForClose: true,
      },
    });
  };

  const noEntries = entries.length === 0 && !selectedEntry;

  if (loading) {
    return (
      <Flex flexDirection="column" marginLeft="spacingL" marginRight="spacingL" style={styles.home}>
        <Flex justifyContent="flex-end" marginTop="spacingS" marginRight="spacingS">
          <SkeletonRow rowCount={1} columnCount={1} />
        </Flex>
        <Box>
          <Splitter marginTop="spacingS" style={styles.splitter} data-test-id="splitter" />
        </Box>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" marginLeft="spacingL" marginRight="spacingL" style={styles.home}>
      <Flex justifyContent="flex-end" marginTop="spacingS" marginRight="spacingS">
        <ButtonMenu buttonLabel="Select entry" isDisabled={noEntries}>
          <Menu.List>
            {entries.map((entry) => (
              <Menu.Item key={entry.sys.id} onClick={() => setSelectedEntry(entry)}>
                {entry.fields[TITLE_ID]?.[defaultLocale]}
              </Menu.Item>
            ))}
          </Menu.List>
        </ButtonMenu>
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
        {entries.length === 0 && (
          <Flex alignItems="center" justifyContent="center" marginTop="spacingL">
            <Card style={styles.card}>
              <Flex flexDirection="column" alignItems="center">
                <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeL">
                  No Homebase entry to display.
                </Text>
                <Paragraph marginTop="spacingXs" marginBottom="spacingL" fontSize="fontSizeM">
                  Create an entry using the HOMEBASE content type.
                </Paragraph>
                <Button onClick={handleCreateEntry} variant="primary">
                  Create entry
                </Button>
              </Flex>
            </Card>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default Home;
