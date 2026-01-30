import { useState, useMemo } from 'react';
import { Text, Icon } from '@contentful/f36-components';
import { useReleases } from '../hooks/useReleases';
import type { ReleaseWithScheduledAction } from '../utils/fetchReleases';
import { GearSixIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { releasesTableStyles as styles } from './tableStyles';
import { ReleasesTableActions } from './ReleasesTableActions';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { formatDateTimeWithTimezone } from '../utils/dateUtils';
import { formatUserName } from '../utils/UserUtils';
import { ContentTable, TableColumn } from './ContentTable';

export const ReleasesTable = () => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const { releases, total, isFetchingReleases, fetchingReleasesError, refetchReleases } =
    useReleases(currentPage);

  const columns = useMemo<TableColumn<ReleaseWithScheduledAction>[]>(
    () => [
      {
        id: 'title',
        label: 'Title',
        style: styles.titleCell,
        render: (item) => <Text fontWeight="fontWeightDemiBold">{item.title}</Text>,
      },
      {
        id: 'scheduledDate',
        label: 'Scheduled Date & Time',
        style: styles.dateCell,
        render: (item) =>
          formatDateTimeWithTimezone(item.scheduledFor.datetime, item.scheduledFor.timezone),
      },
      {
        id: 'items',
        label: 'Items',
        style: styles.itemsCell,
        render: (item) => `${item.itemsCount} items`,
      },
      {
        id: 'updatedAt',
        label: 'Last Updated',
        style: styles.updatedCell,
        render: (item) => formatDateTimeWithTimezone(item.updatedAt),
      },
      {
        id: 'updatedBy',
        label: 'Last Updated By',
        style: styles.userCell,
        render: (item) => formatUserName(item.updatedBy),
      },
      {
        id: 'actions',
        label: (
          <Icon style={{ margin: tokens.spacing2Xs }}>
            <GearSixIcon />
          </Icon>
        ),
        style: styles.actionsCell,
        render: (item) => (
          <ReleasesTableActions release={item} sdk={sdk} onActionSuccess={refetchReleases} />
        ),
      },
    ],
    [sdk, refetchReleases]
  );

  return (
    <ContentTable
      items={releases}
      total={total}
      isFetching={isFetchingReleases}
      error={fetchingReleasesError}
      columns={columns}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      testId="releases-table"
      errorMessage="Failed to load releases"
      emptyStateMessage="Releases will appear here when they are scheduled."
      skeletonColumnCount={6}
    />
  );
};
