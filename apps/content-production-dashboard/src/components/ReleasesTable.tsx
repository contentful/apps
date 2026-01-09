import { useState } from 'react';
import {
  Table,
  Pagination,
  Note,
  Box,
  Skeleton,
  Text,
  Icon,
} from '@contentful/f36-components';
import { GearSixIcon } from '@contentful/f36-icons';
import { RELEASES_PER_PAGE } from '../utils/consts';
import tokens from '@contentful/f36-tokens';
import { styles } from './ReleasesTable.styles';
import { useReleases } from '../hooks/useReleases';


const ReleasesTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.dateCell}>Scheduled Date & Time</Table.Cell>
        <Table.Cell style={styles.itemsCell}>Items</Table.Cell>
        <Table.Cell style={styles.updatedCell}>Last Updated</Table.Cell>
        <Table.Cell style={styles.userCell}>Last Updated By</Table.Cell>
        <Table.Cell style={styles.actionsCell}><Icon style={{ margin: tokens.spacing2Xs }}><GearSixIcon /></Icon></Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const ReleasesTable = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const { releases, total, isFetchingReleases, fetchingReleasesError } = useReleases(currentPage);

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return '—';
    }
  };

  const truncate = (str: string, max: number = 20) =>
    str.length > max ? str.slice(0, max) + ' ...' : str;

  const formatUserName = (user: { id: string; firstName?: string; lastName?: string } | null): string => {
    if (!user) return '—';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || '—';
  };

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
            <Table.Row key={release.releaseId} >
              <Table.Cell style={styles.titleCell}>
                <Text fontWeight="fontWeightDemiBold">{truncate(release.title)}</Text>
              </Table.Cell>
              <Table.Cell style={styles.dateCell}>{formatDate(release.scheduledFor.datetime)}</Table.Cell>
              <Table.Cell style={styles.itemsCell}>{release.itemsCount} items</Table.Cell>
              <Table.Cell style={styles.updatedCell}>{formatDate(release.updatedAt)}</Table.Cell>
              <Table.Cell style={styles.userCell}>{formatUserName(release.updatedBy)}</Table.Cell>
              <Table.Cell style={styles.actionsCell}>
                {/* TODO: Add actions menu here */}
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
          itemsPerPage={RELEASES_PER_PAGE}
        />
      </Box>
    </>
  );
};