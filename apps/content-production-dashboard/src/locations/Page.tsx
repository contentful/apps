import { Box, Button, Card, Flex, Heading, Paragraph, Text } from '@contentful/f36-components';
import { useAllEntries } from '../hooks/useAllEntries';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { styles } from './Page.styles';

const Page = () => {
  const { isFetching, error, refetch } = useAllEntries();

  return (
    <Box padding="spacingXl" className={styles.pageContainer}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <Heading>Content Dashboard</Heading>
        <Button onClick={() => refetch()} variant="secondary" size="small" isDisabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Flex>

      {error ? (
        <ErrorDisplay error={error} />
      ) : isFetching ? (
        <LoadingSkeleton />
      ) : (
        <>{/* TODO: implement the rest of the sections */}</>
      )}
    </Box>
  );
};

export default Page;
