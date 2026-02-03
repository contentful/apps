import { ReactNode } from 'react';
import { Table, Box, Skeleton, Pagination } from '@contentful/f36-components';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { EmptyState } from './EmptyState';
import { ErrorDisplay } from './ErrorDisplay';
import tokens from '@contentful/f36-tokens';

// Fixed height for table container to prevent layout shift when paginating
// Header row (~48px) + ITEMS_PER_PAGE rows (~48px each)
const TABLE_CONTAINER_HEIGHT = `${64 + ITEMS_PER_PAGE * 48}px`;

export interface TableColumn<T> {
  id: string;
  label: string | ReactNode;
  style?: React.CSSProperties;
  render: (item: T) => ReactNode;
}

export interface ContentTableProps<T> {
  items: T[];
  total: number;
  isFetching: boolean;
  error: Error | null;
  columns: TableColumn<T>[];
  currentPage: number;
  onPageChange: (page: number) => void;
  testId?: string;
  skeletonColumnCount?: number;
  errorMessage?: string;
  emptyStateMessage?: string;
}

const TableHeader = <T,>({ columns }: { columns: TableColumn<T>[] }) => {
  return (
    <Table.Head>
      <Table.Row>
        {columns.map((column) => (
          <Table.Cell key={column.id} style={column.style}>
            {column.label}
          </Table.Cell>
        ))}
      </Table.Row>
    </Table.Head>
  );
};

export function ContentTable<T extends { id: string }>({
  items,
  total,
  isFetching,
  error,
  columns,
  currentPage,
  onPageChange,
  testId,
  skeletonColumnCount,
  errorMessage,
  emptyStateMessage,
}: ContentTableProps<T>) {
  if (error) {
    const displayError = errorMessage
      ? new Error(errorMessage)
      : error instanceof Error
      ? error
      : new Error('Unknown error');

    return <ErrorDisplay error={displayError} />;
  }

  if (isFetching) {
    const columnCount = skeletonColumnCount ?? columns.length;
    return (
      <Box style={{ minHeight: TABLE_CONTAINER_HEIGHT }}>
        <Table>
          <TableHeader columns={columns} />
          <Table.Body testId={testId ? `${testId}-skeleton` : undefined}>
            <Skeleton.Row rowCount={ITEMS_PER_PAGE} columnCount={columnCount} />
          </Table.Body>
        </Table>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        helperText={emptyStateMessage || 'Data will display once entry activity is available.'}
      />
    );
  }

  return (
    <>
      <Box style={{ minHeight: TABLE_CONTAINER_HEIGHT }}>
        <Table>
          <TableHeader columns={columns} />
          <Table.Body testId={testId}>
            {items.map((item) => (
              <Table.Row key={item.id}>
                {columns.map((column) => (
                  <Table.Cell key={column.id} style={column.style}>
                    {column.render(item)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Box>
      {total > ITEMS_PER_PAGE && (
        <Box marginTop="spacingL">
          <Pagination
            activePage={currentPage}
            onPageChange={onPageChange}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </Box>
      )}
    </>
  );
}
