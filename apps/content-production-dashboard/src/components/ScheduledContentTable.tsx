import { useState } from 'react';
import { Table, Box, Skeleton, Pagination, Badge } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { styles } from './ScheduledContentTable.styles';
import { EmptyStateTable } from './EmptyStateTable';

import { formatDateTimeWithTimezone } from '../utils/dateFormat';
import { formatUserName } from '../utils/UserUtils';
import { ITEMS_PER_PAGE } from '../utils/consts';

import { EntryLink } from './EntryLink';
import { EntryStatus, ScheduledContentItem } from '../utils/types';
import { useScheduledContent } from '../hooks/useScheduledContent';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';
import { ErrorDisplay } from './ErrorDisplay';

enum BadgeVariant {
  Primary = 'primary',
  Positive = 'positive',
  Warning = 'warning',
}

const ScheduledContentTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.scheduledDateCell}>Scheduled Date</Table.Cell>
        <Table.Cell style={styles.publishedDateCell}>Published Date</Table.Cell>
        <Table.Cell style={styles.statusCell}>Status</Table.Cell>
        <Table.Cell style={styles.contentTypeCell}>Content Type</Table.Cell>
        <Table.Cell style={styles.creatorCell}>Creator</Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

const getStatusBadgeVariant = (status: EntryStatus | undefined): BadgeVariant => {
  if (status === EntryStatus.Published) {
    return BadgeVariant.Positive;
  }
  if (status === EntryStatus.Changed) {
    return BadgeVariant.Primary;
  }
  return BadgeVariant.Warning;
};

export const ScheduledContentTable = ({
  scheduledActions,
  entries,
  contentTypes,
}: {
  scheduledActions: ScheduledActionProps[];
  entries: EntryProps[];
  contentTypes: Map<string, ContentTypeProps>;
}) => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const { items, total, isFetching, error } = useScheduledContent(
    scheduledActions,
    entries,
    sdk.locales.default,
    currentPage,
    contentTypes
  );

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isFetching) {
    return (
      <>
        <Table>
          <ScheduledContentTableHeader />
          <Table.Body testId="scheduled-content-table-skeleton">
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
        <ScheduledContentTableHeader />
        <Table.Body>
          {items.map((item: ScheduledContentItem) => (
            <Table.Row key={item.id}>
              <Table.Cell style={styles.titleCell}>
                <EntryLink entryId={item.id} spaceId={sdk.ids.space}>
                  {item.title}
                </EntryLink>
              </Table.Cell>
              <Table.Cell style={styles.scheduledDateCell}>
                {formatDateTimeWithTimezone(item.scheduledFor.datetime, item.scheduledFor.timezone)}
              </Table.Cell>
              <Table.Cell style={styles.publishedDateCell}>
                {formatDateTimeWithTimezone(item.publishedDate || '')}
              </Table.Cell>
              <Table.Cell style={styles.statusCell}>
                <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
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
