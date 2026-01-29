import { useState, useMemo } from 'react';
import { Badge } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { scheduledContentTableStyles as styles } from './tableStyles';
import { formatDateTimeWithTimezone } from '../utils/dateUtils';
import { formatUserName } from '../utils/UserUtils';
import { EntryLink } from './EntryLink';
import { EntryStatus, ScheduledContentItem } from '../utils/types';
import { useScheduledContent } from '../hooks/useScheduledContent';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';
import { ContentTable, TableColumn } from './ContentTable';

enum BadgeVariant {
  Primary = 'primary',
  Positive = 'positive',
  Warning = 'warning',
}

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

  const columns = useMemo<TableColumn<ScheduledContentItem>[]>(
    () => [
      {
        id: 'title',
        label: 'Title',
        style: styles.titleCell,
        render: (item) => (
          <EntryLink entryId={item.id} spaceId={sdk.ids.space}>
            {item.title}
          </EntryLink>
        ),
      },
      {
        id: 'scheduledDate',
        label: 'Scheduled Date',
        style: styles.scheduledDateCell,
        render: (item) =>
          formatDateTimeWithTimezone(item.scheduledFor.datetime, item.scheduledFor.timezone),
      },
      {
        id: 'publishedDate',
        label: 'Published Date',
        style: styles.publishedDateCell,
        render: (item) => formatDateTimeWithTimezone(item.publishedDate || ''),
      },
      {
        id: 'status',
        label: 'Status',
        style: styles.statusCell,
        render: (item) => <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>,
      },
      {
        id: 'contentType',
        label: 'Content Type',
        style: styles.contentTypeCell,
        render: (item) => item.contentType,
      },
      {
        id: 'creator',
        label: 'Creator',
        style: styles.creatorCell,
        render: (item) => formatUserName(item.creator),
      },
    ],
    [sdk.ids.space]
  );

  return (
    <ContentTable
      items={items}
      total={total}
      isFetching={isFetching}
      error={error}
      columns={columns}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      testId="scheduled-content-table"
      skeletonColumnCount={5}
    />
  );
};
