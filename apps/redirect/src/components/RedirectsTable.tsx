import { useState, useMemo } from 'react';
import { Text, Flex, TextLink, Badge, RelativeDateTime, Select } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { redirectsTableStyles as styles } from './RedirectsTable.styles';
import { ContentTable } from './ContentTable';
import { useRedirects } from '../hooks/useRedirects';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { TableColumn } from '../utils/types';
import { EntryProps } from 'contentful-management';
import { truncateText } from '../utils/utils';
import { SearchBar } from './SearchBar';

export const RedirectsTable = () => {
  const sdk = useSDK<PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const { redirects, total, isFetchingRedirects, fetchingRedirectsError, refetchRedirects } =
    useRedirects(currentPage, itemsPerPage, searchQuery, typeFilter, statusFilter);

  const handleEdit = () => {
    // todo: open edit modal
  };

  const defaultLocaleValue = sdk.locales.default || 'en-US';

  const handleSearchChange = (query: string) => {
    setCurrentPage(0);
    setSearchQuery(query);
  };

  const columns = useMemo<TableColumn<EntryProps>[]>(
    () => [
      {
        id: 'source',
        label: 'Source',
        style: styles.sourceColumn,
        render: (item) => (
          <Flex flexDirection="column" alignItems="start" gap="spacing2Xs">
            <TextLink
              onClick={() =>
                sdk.navigator.openEntry(item.fields.redirectFromContentTypes?.sys?.id ?? '')
              }
              icon={<ArrowSquareOutIcon />}
              alignIcon="end">
              {truncateText(item.fields.redirectFromContentTypes?.title, 50)}
            </TextLink>
            <Text fontColor="gray500">/slug</Text>
          </Flex>
        ),
      },
      {
        id: 'destination',
        label: 'Destination',
        style: styles.destinationColumn,
        render: (item) => (
          <Flex flexDirection="column" alignItems="start" gap="spacing2Xs">
            <TextLink
              onClick={() =>
                sdk.navigator.openEntry(item.fields.redirectToContentTypes?.sys?.id ?? '')
              }>
              {truncateText(item.fields.redirectToContentTypes?.title, 50)}
            </TextLink>
            <Text fontColor="gray500">/slug</Text>
          </Flex>
        ),
      },
      {
        id: 'reason',
        label: 'Reason',
        style: styles.reasonColumn,
        render: (item) => truncateText(item.fields.reason[defaultLocaleValue] ?? '—', 180),
      },
      {
        id: 'type',
        label: 'Type',
        style: styles.typeColumn,
        render: (item) => item.fields.redirectType[defaultLocaleValue] ?? '—',
      },
      {
        id: 'status',
        label: 'Status',
        style: styles.statusColumn,
        render: (item) => (
          <Badge variant={item.fields.active[defaultLocaleValue] ? 'positive' : 'warning'}>
            {item.fields.active[defaultLocaleValue] ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'createdAt',
        label: 'Created',
        style: styles.createdColumn,
        render: (item) => <RelativeDateTime date={new Date(item.sys.createdAt)} />,
      },
      {
        id: 'actions',
        label: '',
        style: styles.actionsColumn,
        render: () => (
          <TextLink style={styles.linkStyles} onClick={handleEdit}>
            Edit
          </TextLink>
        ),
      },
    ],
    [sdk, refetchRedirects]
  );

  return (
    <>
      <Flex
        justifyContent="space-between"
        alignItems="flex-end"
        marginBottom="spacingM"
        gap="spacingS">
        <Select
          value={typeFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setCurrentPage(0);
            setTypeFilter(e.target.value);
          }}>
          <Select.Option value="">Filter by type</Select.Option>
          <Select.Option value="Permanent (301)">Permanent (301)</Select.Option>
          <Select.Option value="Temporary (302)">Temporary (302)</Select.Option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value as '' | 'active' | 'inactive';
            setCurrentPage(0);
            setStatusFilter(value);
          }}>
          <Select.Option value="">Filter by status</Select.Option>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="inactive">Inactive</Select.Option>
        </Select>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isDisabled={isFetchingRedirects}
        />
      </Flex>
      <ContentTable
        items={redirects}
        total={total}
        isFetching={isFetchingRedirects}
        error={fetchingRedirectsError}
        columns={columns}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onViewPerPageChange={(itemsPerPage) => {
          setCurrentPage(0);
          setItemsPerPage(itemsPerPage);
          refetchRedirects();
        }}
        testId="redirects-table"
        errorMessage="Failed to load redirects"
        emptyStateMessage="Redirects will appear here when they are created."
        skeletonColumnCount={6}
      />
    </>
  );
};
