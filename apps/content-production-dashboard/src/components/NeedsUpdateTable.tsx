import { useState } from 'react';
import { Table, Note, Box, Skeleton, Pagination } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { styles } from './NeedsUpdateTable.styles';
import { EmptyStateTable } from './EmptyStateTable';
import { EntryLink } from './EntryLink';
import { useNeedsUpdate } from '../hooks/useNeedsUpdateContent';
import { formatDateTimeWithTimezone } from '../utils/dateFormat';
import { formatUserName } from '../utils/UserUtils';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { EntryProps } from 'contentful-management';

const NeedsUpdateTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.ageCell}>Age</Table.Cell>
        <Table.Cell style={styles.publishedDateCell}>Published Date</Table.Cell>
        <Table.Cell style={styles.contentTypeCell}>Content Type</Table.Cell>
        <Table.Cell style={styles.creatorCell}>Creator</Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const NeedsUpdateTable = ({ entries }: { entries: EntryProps[] }) => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const { items, total, isFetching, error } = useNeedsUpdate(entries, currentPage);

  if (error) {
    return (
      <Box marginTop="spacingXl">
        <Note variant="negative" title="Error loading content that needs update">
          Failed to load content that needs update
        </Note>
      </Box>
    );
  }

  if (isFetching) {
    return (
      <>
        <Table>
          <NeedsUpdateTableHeader />
          <Table.Body testId="needs-update-table-skeleton">
            <Skeleton.Row rowCount={5} columnCount={5} />
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
        <NeedsUpdateTableHeader />
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell style={styles.titleCell}>
                <EntryLink entryId={item.id} spaceId={sdk.ids.space}>
                  {item.title}
                </EntryLink>
              </Table.Cell>
              <Table.Cell style={styles.ageCell}>
                {item.age !== undefined
                  ? ((ageInDays: number): string => {
                      return `${ageInDays} day${ageInDays !== 1 ? 's' : ''}`;
                    })(item.age)
                  : '—'}
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
