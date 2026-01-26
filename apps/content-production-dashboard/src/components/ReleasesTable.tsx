import { useState } from 'react';
import { Table, Pagination, Note, Box, Skeleton, Text, Icon } from '@contentful/f36-components';
import { useReleases } from '../hooks/useReleases';
import { GearSixIcon } from '@contentful/f36-icons';
import { ITEMS_PER_PAGE } from '../utils/consts';
import tokens from '@contentful/f36-tokens';
import { styles } from './ReleasesTable.styles';
import { ReleasesTableActions } from './ReleasesTableActions';
import { useSDK } from '@contentful/react-apps-toolkit';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { formatDateTimeWithTimezone } from '../utils/dateFormat';
import { formatUserName } from '../utils/UserUtils';

const ReleasesTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.dateCell}>Scheduled Date & Time</Table.Cell>
        <Table.Cell style={styles.itemsCell}>Items</Table.Cell>
        <Table.Cell style={styles.updatedCell}>Last Updated</Table.Cell>
        <Table.Cell style={styles.userCell}>Last Updated By</Table.Cell>
        <Table.Cell style={styles.actionsCell}>
          <Icon style={{ margin: tokens.spacing2Xs }}>
            <GearSixIcon />
          </Icon>
        </Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const ReleasesTable = () => {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const { releases, total, isFetchingReleases, fetchingReleasesError, refetchReleases } =
    useReleases(currentPage);

  if (fetchingReleasesError) {
    return (
      <Box marginTop="spacingXl">
        <Note variant="negative" title="Error loading releases">
          Failed to load releases
        </Note>
      </Box>
    );
  }

  if (isFetchingReleases && releases.length === 0) {
    return (
      <>
        <Table>
          <ReleasesTableHeader />
          <Table.Body>
            <Skeleton.Row rowCount={5} columnCount={6} />
          </Table.Body>
        </Table>
      </>
    );
  }

  if (releases.length === 0) {
    return (
      <Box padding="spacing3Xl" style={styles.emptyState}>
        <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold" marginBottom="spacingS">
          No scheduled releases
        </Text>
        <Text fontSize="fontSizeM" fontColor="gray600">
          Releases will appear here when they are scheduled.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Table>
        <ReleasesTableHeader />
        <Table.Body>
          {releases.map((release) => (
            <Table.Row key={release.releaseId}>
              <Table.Cell style={styles.titleCell}>
                <Text fontWeight="fontWeightDemiBold">{release.title}</Text>
              </Table.Cell>
              <Table.Cell style={styles.dateCell}>
                {formatDateTimeWithTimezone(
                  release.scheduledFor.datetime,
                  release.scheduledFor.timezone
                )}
              </Table.Cell>
              <Table.Cell style={styles.itemsCell}>{release.itemsCount} items</Table.Cell>
              <Table.Cell style={styles.updatedCell}>
                {formatDateTimeWithTimezone(release.updatedAt)}
              </Table.Cell>
              <Table.Cell style={styles.userCell}>{formatUserName(release.updatedBy)}</Table.Cell>
              <Table.Cell style={styles.actionsCell}>
                <ReleasesTableActions
                  release={release}
                  sdk={sdk}
                  onActionSuccess={refetchReleases}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Box marginTop="spacingL">
        <Pagination
          activePage={currentPage}
          onPageChange={setCurrentPage}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Box>
    </>
  );
};
