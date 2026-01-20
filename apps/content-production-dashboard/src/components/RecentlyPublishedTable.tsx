import { Table } from '@contentful/f36-components';
import { styles } from './RecentlyPublishedTable.styles';
import { EmptyStateTable } from './EmptyStateTable';

const RecentlyPublishedTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.creatorCell}>Creator</Table.Cell>
        <Table.Cell style={styles.contentTypeCell}>Content Type</Table.Cell>
        <Table.Cell style={styles.publishedDateCell}>Published Date</Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const RecentlyPublishedTable = () => {
  return (
    <Table>
      <RecentlyPublishedTableHeader />
      <Table.Body>
        <EmptyStateTable />
      </Table.Body>
    </Table>
  );
};

