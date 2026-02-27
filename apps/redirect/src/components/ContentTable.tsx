import { Table, Box, Skeleton, Pagination } from '@contentful/f36-components';
import { EmptyState } from './EmptyState';
import { ErrorDisplay } from './ErrorDisplay';
import { tableContainerStyles } from './RedirectsTable.styles';
import { ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS } from '../utils/consts';
import { TableColumn } from '../utils/types';

export interface ContentTableProps<T> {
  items: T[];
  total: number;
  isFetching: boolean;
  itemsPerPage: number;
  error: Error | null;
  columns: TableColumn<T>[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewPerPageChange: (itemsPerPage: number) => void;
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

export function ContentTable<T extends { sys: { id: string } }>({
  items,
  total,
  isFetching,
  error,
  columns,
  itemsPerPage,
  currentPage,
  onPageChange,
  onViewPerPageChange,
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
      <Box style={tableContainerStyles}>
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
      <Box style={tableContainerStyles}>
        <Table>
          <TableHeader columns={columns} />
          <Table.Body testId={testId}>
            {items.map((item) => (
              <Table.Row key={item.sys.id}>
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
      {total > 0 && (
        <Box marginTop="spacingL">
          <Pagination
            key={`pagination-${itemsPerPage}`}
            activePage={currentPage}
            onPageChange={onPageChange}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            showViewPerPage
            viewPerPageOptions={PAGE_SIZE_OPTIONS}
            onViewPerPageChange={onViewPerPageChange}
          />
        </Box>
      )}
    </>
  );
}
