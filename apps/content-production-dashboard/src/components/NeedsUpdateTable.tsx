import { Table } from '@contentful/f36-components';
import { styles } from './NeedsUpdateTable.styles';
import { EmptyStateTable } from './EmptyStateTable';

const NeedsUpdateTableHeader = () => {
  return (
    <Table.Head>
      <Table.Row>
        <Table.Cell style={styles.titleCell}>Title</Table.Cell>
        <Table.Cell style={styles.creatorCell}>Creator</Table.Cell>
        <Table.Cell style={styles.contentTypeCell}>Content Type</Table.Cell>
        <Table.Cell style={styles.publishedDateCell}>Published Date</Table.Cell>
        <Table.Cell style={styles.ageCell}>Age</Table.Cell>
      </Table.Row>
    </Table.Head>
  );
};

export const NeedsUpdateTable = () => {
  return (
    <Table>
      <NeedsUpdateTableHeader />
      <Table.Body>
        <EmptyStateTable colSpan={5} />
      </Table.Body>
    </Table>
  );
};

