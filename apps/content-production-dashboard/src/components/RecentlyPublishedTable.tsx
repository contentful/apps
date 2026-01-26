import { Box, Pagination, Skeleton, Table } from '@contentful/f36-components';
import { styles } from './RecentlyPublishedTable.styles';
import { EmptyStateTable } from './EmptyStateTable';
import { EntryProps } from 'contentful-management';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { formatDateTimeWithTimezone } from '../utils/dateFormat';
import { formatUserName } from '../utils/UserUtils';
import { EntryLink } from './EntryLink';
import { useState } from 'react';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useRecentlyPublishedContent } from '../hooks/useRecentlyPublishedContent';
import { ErrorDisplay } from './ErrorDisplay';
import { subDays } from '../utils/dateCalculator';
import type { AppInstallationParameters } from '../locations/ConfigScreen';

const RecentlyPublishedTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.publishedDateCell}>Published Date</Table.Cell>
        <Table.Cell style={styles.contentTypeCell}>Content Type</Table.Cell>
        <Table.Cell style={styles.creatorCell}>Creator</Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const RecentlyPublishedTable = ({ entries }: { entries: EntryProps[] }) => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const recentlyPublishedDays = installation.recentlyPublishedDays ?? 7;
  const recentlyPublishedDate = subDays(new Date(), recentlyPublishedDays);

  const { items, total, isFetching, error } = useRecentlyPublishedContent(
    currentPage,
    entries,
    recentlyPublishedDate,
    sdk.locales.default
  );

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isFetching) {
    return (
      <>
        <Table>
          <RecentlyPublishedTableHeader />
          <Table.Body testId="recently-published-table-skeleton">
            <Skeleton.Row rowCount={5} columnCount={6} />
          </Table.Body>
        </Table>
      </>
    );
  }

  if (items.length === 0) {
    return <EmptyStateTable />;
  }

  return (
    <>
      <Table>
        <RecentlyPublishedTableHeader />
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell style={styles.titleCell}>
                <EntryLink entryId={item.id} spaceId={sdk.ids.space}>
                  {item.title}
                </EntryLink>
              </Table.Cell>
              <Table.Cell style={styles.publishedDateCell}>
                {formatDateTimeWithTimezone(item.publishedDate || undefined)}
              </Table.Cell>
              <Table.Cell style={styles.contentTypeCell}>{item.contentType}</Table.Cell>
              <Table.Cell style={styles.creatorCell}>{formatUserName(item.creator)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {total > ITEMS_PER_PAGE && (
        <Box marginTop="spacingL">
          <Pagination
            activePage={currentPage}
            onPageChange={setCurrentPage}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </Box>
      )}
    </>
  );
};
