import { Table } from '@contentful/f36-components';
import { styles } from './ScheduledContentTable.styles';
import { EmptyStateTable } from './EmptyStateTable';

const ScheduledContentTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.creatorCell}>Creator</Table.Cell>
        <Table.Cell style={styles.contentTypeCell}>Content Type</Table.Cell>
        <Table.Cell style={styles.publishedDateCell}>Published Date</Table.Cell>
        <Table.Cell style={styles.scheduledDateCell}>Scheduled Date</Table.Cell>
        <Table.Cell style={styles.statusCell}>Status</Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const ScheduledContentTable = () => {
  const ITEMS = []; // TODO: Add actual items here

  if (ITEMS.length === 0) {
    return <EmptyStateTable />;
  }

  return (
    <Table>
      <ScheduledContentTableHeader />
      <Table.Body>
        <EmptyStateTable />
      </Table.Body>
    </Table>
  );
};
