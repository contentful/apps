import { useState, useMemo } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { recentlyPublishedTableStyles as styles } from './tableStyles';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { formatDateTimeWithTimezone, subDays } from '../utils/dateUtils';
import { formatUserName } from '../utils/UserUtils';
import { EntryLink } from './EntryLink';
import {
  useRecentlyPublishedContent,
  RecentlyPublishedItem,
} from '../hooks/useRecentlyPublishedContent';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { ContentTable, TableColumn } from './ContentTable';

export const RecentlyPublishedTable = ({
  entries,
  contentTypes,
}: {
  entries: EntryProps[];
  contentTypes: Map<string, ContentTypeProps>;
}) => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const recentlyPublishedDays = installation.recentlyPublishedDays ?? 7;
  const recentlyPublishedDate = subDays(new Date(), recentlyPublishedDays);

  const { items, total, isFetching, error } = useRecentlyPublishedContent(
    currentPage,
    entries,
    recentlyPublishedDate,
    sdk.locales.default,
    contentTypes
  );

  const columns = useMemo<TableColumn<RecentlyPublishedItem>[]>(
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
        id: 'publishedDate',
        label: 'Published Date',
        style: styles.publishedDateCell,
        render: (item) => formatDateTimeWithTimezone(item.publishedDate || undefined),
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
      testId="recently-published-table"
      skeletonColumnCount={5}
    />
  );
};
