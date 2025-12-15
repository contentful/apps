import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Paragraph,
  Spinner,
  Text,
  Note,
} from '@contentful/f36-components';
import { useAllEntries } from '../hooks/useAllEntries';

const Page = () => {
  const { entries, total, isLoading, isFetching, error, refetch, fetchedAt } = useAllEntries();

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);
  };

  if (error) {
    return (
      <Box padding="spacingXl">
        <Card>
          <Note variant="negative" title="Error loading entries">
            <Paragraph>{error.message}</Paragraph>
            <Button onClick={() => refetch()} variant="primary" size="small">
              Retry
            </Button>
          </Note>
        </Card>
      </Box>
    );
  }

  return (
    <Box padding="spacingXl">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <div>
          <Heading>All Entries</Heading>
          <Text as="p" fontColor="gray600" fontSize="fontSizeM">
            {isLoading ? 'Loading entries...' : `Total: ${total} entries`}
            {fetchedAt && !isLoading && <> • Last fetched: {formatDate(fetchedAt)}</>}
          </Text>
        </div>
        <Button onClick={() => refetch()} variant="secondary" size="small" isDisabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Flex>

      {isLoading ? (
        <Card>
          <Flex justifyContent="center" alignItems="center" padding="spacingXl">
            <Spinner size="large" />
            <Paragraph marginLeft="spacingM">Fetching all entries from the space...</Paragraph>
          </Flex>
        </Card>
      ) : (
        <Card>
          {entries.length === 0 ? (
            <Box padding="spacingXl">
              <Paragraph>No entries found in this space.</Paragraph>
            </Box>
          ) : (
            <Box padding="spacingM">
              <Paragraph>
                Successfully loaded <strong>{entries.length}</strong> entries.
                {isFetching && (
                  <Text as="span" fontColor="gray600" marginLeft="spacingS">
                    (Refreshing...)
                  </Text>
                )}
              </Paragraph>
              {/* TODO: Add virtual scrolling or pagination for large entry lists */}
              {/* TODO: Add entry list display with filtering/search capabilities */}
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default Page;
