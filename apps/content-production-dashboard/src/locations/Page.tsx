import { Box, Button, Card, Flex, Heading, Paragraph, Text } from '@contentful/f36-components';
import { useAllEntries } from '../hooks/useAllEntries';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { styles } from './Page.styles';

const Page = () => {
  const { entries, total, isLoading, isFetching, error, refetch, fetchedAt } = useAllEntries();

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);
  };

  return (
    <Box padding="spacingXl" className={styles.pageContainer}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <Heading>Content Dashboard</Heading>
        <Button onClick={() => refetch()} variant="secondary" size="small" isDisabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Flex>

      {error ? (
        <ErrorDisplay error={error} onRetry={() => refetch()} />
      ) : isLoading || isFetching ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* TODO: remove this section from below when implementing the UI tickets */}
          <Card>
            <Box padding="spacingM">
              <Text as="p" fontColor="gray600" fontSize="fontSizeM" marginBottom="spacingS">
                {isLoading ? 'Loading entries...' : `Total: ${total} entries`}
                {fetchedAt && !isLoading && <> • Last fetched: {formatDate(fetchedAt)}</>}
              </Text>
              {entries.length === 0 ? (
                <Paragraph>No entries found in this space.</Paragraph>
              ) : (
                <Paragraph>
                  Successfully loaded <strong>{entries.length}</strong> entries.
                  {isFetching && (
                    <Text as="span" fontColor="gray600" marginLeft="spacingS">
                      (Refreshing...)
                    </Text>
                  )}
                </Paragraph>
              )}
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Page;
