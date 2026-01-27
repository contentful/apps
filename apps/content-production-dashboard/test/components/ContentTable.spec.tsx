import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentTable, TableColumn } from '../../src/components/ContentTable';
import { ITEMS_PER_PAGE } from '../../src/utils/consts';

interface TestItem {
  id: string;
  name: string;
}

const createColumns = (): TableColumn<TestItem>[] => [
  {
    id: 'name',
    label: 'Name',
    render: (item) => item.name,
  },
];

describe('ContentTable component', () => {
  const columns = createColumns();
  const onPageChange = vi.fn();

  it('renders ErrorDisplay when error is provided', () => {
    const error = new Error('Something went wrong');

    render(
      <ContentTable<TestItem>
        items={[]}
        total={0}
        isFetching={false}
        error={error}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders ErrorDisplay with custom message when errorMessage is provided', () => {
    const error = new Error('Original error');

    render(
      <ContentTable<TestItem>
        items={[]}
        total={0}
        isFetching={false}
        error={error}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
        errorMessage="Custom error message"
      />
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders loading skeleton when isFetching is true', () => {
    render(
      <ContentTable<TestItem>
        items={[]}
        total={0}
        isFetching
        error={null}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByTestId('content-table-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when there are no items and not fetching or error', () => {
    render(
      <ContentTable<TestItem>
        items={[]}
        total={0}
        isFetching={false}
        error={null}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
      />
    );

    expect(screen.getByText('No entries found')).toBeInTheDocument();
  });

  it('renders rows when items are provided', () => {
    const items: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    render(
      <ContentTable<TestItem>
        items={items}
        total={items.length}
        isFetching={false}
        error={null}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders pagination when total items exceed page size', () => {
    const items: TestItem[] = Array.from({ length: ITEMS_PER_PAGE }, (_, index) => ({
      id: String(index),
      name: `Item ${index}`,
    }));

    render(
      <ContentTable<TestItem>
        items={items}
        total={ITEMS_PER_PAGE + 1}
        isFetching={false}
        error={null}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
      />
    );

    expect(screen.getByTestId('cf-ui-pagination')).toBeInTheDocument();
  });

  it('does not render pagination when total items do not exceed page size', () => {
    const items: TestItem[] = Array.from({ length: ITEMS_PER_PAGE }, (_, index) => ({
      id: String(index),
      name: `Item ${index}`,
    }));

    render(
      <ContentTable<TestItem>
        items={items}
        total={ITEMS_PER_PAGE}
        isFetching={false}
        error={null}
        columns={columns}
        currentPage={1}
        onPageChange={onPageChange}
        testId="content-table"
      />
    );

    expect(screen.queryByTestId('cf-ui-pagination')).not.toBeInTheDocument();
  });
});
