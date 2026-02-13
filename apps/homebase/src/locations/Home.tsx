import { HomeAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Card,
  Flex,
  Menu,
  Paragraph,
  SkeletonContainer,
  Text,
  SkeletonBodyText,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  CONTENT_TYPE_ID,
  DEFAULT_SELECT_LABEL,
  MARKDOWN_ID,
  STORAGE_KEY,
  TITLE_ID,
} from '../consts';
import { useEffect, useState } from 'react';
import { EntryProps } from 'contentful-management';
import MarkdownPreview from '../components/MarkdownPreview';
import { styles } from './Home.styles';
import { Splitter } from 'contentful-app-components';
import ButtonMenu from '../components/ButonMenu';
import { ChevronDownIcon, PreviewIcon } from '@contentful/f36-icons';

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

      const savedEntryId = localStorage.getItem(STORAGE_KEY);
      if (savedEntryId) {
        const savedEntry = entries.items.find((entry) => entry.sys.id === savedEntryId);
        if (savedEntry) {
          setSelectedEntry(savedEntry);
          setLoading(false);
          return;
        }
      }

      if (entries.items.length > 0) {
        setSelectedEntry(entries.items[0]);
      }

      setLoading(false);
    };
    getEntries();
  }, []);

  useEffect(() => {
    if (selectedEntry) {
      localStorage.setItem(STORAGE_KEY, selectedEntry.sys.id);
    }
  }, [selectedEntry]);

  const handleCreateEntry = async () => {
    await sdk.navigator.openNewEntry(CONTENT_TYPE_ID, {
      slideIn: {
        waitForClose: true,
      },
    });
  };

  const handleEditEntry = () => {
    if (selectedEntry) {
      sdk.navigator.openEntry(selectedEntry.sys.id, {
        slideIn: true,
      });
    }
  };

  const noEntries = entries.length === 0 && !selectedEntry;

  const displayName = (entry: EntryProps) => {
    return entry.fields[TITLE_ID]?.[defaultLocale];
  };

  if (loading) {
    return (
      <Flex flexDirection="column" marginLeft="spacingL" marginRight="spacingL" style={styles.home}>
        <Flex justifyContent="flex-end" marginTop="spacingS" marginRight="spacingS" gap="spacingS">
          <SkeletonContainer style={styles.skeletonSelectButton}>
            <SkeletonBodyText numberOfLines={1} />
          </SkeletonContainer>
          <SkeletonContainer style={styles.skeletonEditButton}>
            <SkeletonBodyText numberOfLines={1} />
          </SkeletonContainer>
        </Flex>
        <Flex>
          <Splitter marginTop="spacingS" style={styles.splitter} data-test-id="splitter" />
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" marginLeft="spacingL" marginRight="spacingL" style={styles.home}>
      <Flex justifyContent="flex-end" marginTop="spacingS" marginRight="spacingS" gap="spacingS">
        <ButtonMenu
          buttonLabel={selectedEntry ? displayName(selectedEntry) : DEFAULT_SELECT_LABEL}
          isDisabled={noEntries}
          buttonProps={{ endIcon: <ChevronDownIcon /> }}>
          <Menu.List>
            {entries.map((entry) => (
              <Menu.Item key={entry.sys.id} onClick={() => setSelectedEntry(entry)}>
                {displayName(entry)}
              </Menu.Item>
            ))}
          </Menu.List>
        </ButtonMenu>
        <Button
          variant="secondary"
          onClick={handleEditEntry}
          isDisabled={!selectedEntry}
          startIcon={<PreviewIcon />}
        />
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
