import { useState, useMemo } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { needsUpdateTableStyles as styles } from './tableStyles';
import { EntryLink } from './EntryLink';
import { useNeedsUpdate, NeedsUpdateItem } from '../hooks/useNeedsUpdateContent';
import { formatDateTimeWithTimezone } from '../utils/dateUtils';
import { formatUserName } from '../utils/UserUtils';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { ContentTable, TableColumn } from './ContentTable';
import { getEnvironmentId } from '../utils/sdkUtils';

export const NeedsUpdateTable = ({
  entries,
  contentTypes,
}: {
  entries: EntryProps[];
  contentTypes: Map<string, ContentTypeProps>;
}) => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const { items, total, isFetching, error } = useNeedsUpdate(entries, currentPage, contentTypes);

  const columns = useMemo<TableColumn<NeedsUpdateItem>[]>(
    () => [
      {
        id: 'title',
        label: 'Title',
        style: styles.titleCell,
        render: (item) => (
          <EntryLink
            entryId={item.id}
            spaceId={sdk.ids.space}
            environmentId={getEnvironmentId(sdk)}>
            {item.title}
          </EntryLink>
        ),
      },
      {
        id: 'age',
        label: 'Age',
        style: styles.ageCell,
        render: (item) =>
          item.age !== undefined ? `${item.age} day${item.age !== 1 ? 's' : ''}` : '—',
      },
      {
        id: 'publishedDate',
        label: 'Published date',
        style: styles.publishedDateCell,
        render: (item) => formatDateTimeWithTimezone(item.publishedDate || undefined),
      },
      {
        id: 'contentType',
        label: 'Content type',
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
      testId="needs-update-table"
      errorMessage="Failed to load content that needs updating"
      skeletonColumnCount={5}
    />
  );
};
