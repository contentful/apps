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
  const ITEMS = [] // TODO: Add actual items here 

  if (ITEMS.length === 0) {
    return <EmptyStateTable />;
  }

  return (
    <Table>
      <RecentlyPublishedTableHeader />
    </Table>
  );
};

