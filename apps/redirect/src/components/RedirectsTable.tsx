import { useState, useMemo, SetStateAction } from 'react';
import {
  Text,
  Flex,
  TextLink,
  Badge,
  RelativeDateTime,
  Box,
  Stack,
  Pill,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { redirectsTableStyles as styles } from './RedirectsTable.styles';
import { ContentTable } from './ContentTable';
import { useRedirects } from '../hooks/useRedirects';
import { ITEMS_PER_PAGE, STATUS_FILTER_OPTIONS, TYPE_FILTER_OPTIONS } from '../utils/consts';
import { TableColumn } from '../utils/types';
import { EntryProps } from 'contentful-management';
import { truncateText } from '../utils/utils';
import { SearchBar } from './SearchBar';
import FilterMultiselect from './FilterMultiselect';

export const RedirectsTable = () => {
  const sdk = useSDK<PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
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

  const handleToggleFilter = (
    value: string,
    checked: boolean,
    setFilter: (value: SetStateAction<string[]>) => void
  ) => {
    setCurrentPage(0);
    setFilter((prev) =>
      checked ? [...prev, value] : prev.filter((filterValue) => filterValue !== value)
    );
  };

  return (
    <>
      <Flex style={styles.filtersRow} alignItems="flex-end" marginBottom="spacingM" gap="spacingS">
        <FilterMultiselect
          type="type"
          options={TYPE_FILTER_OPTIONS}
          selectedItems={typeFilter}
          setSelectedItems={setTypeFilter}
          handleToggleFilter={handleToggleFilter}
        />
        <FilterMultiselect
          type="status"
          options={STATUS_FILTER_OPTIONS}
          selectedItems={statusFilter}
          setSelectedItems={setStatusFilter}
          handleToggleFilter={handleToggleFilter}
        />
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isDisabled={isFetchingRedirects}
        />
      </Flex>
      {(typeFilter.length > 0 || statusFilter.length > 0) && (
        <Box marginBottom="spacingM">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {typeFilter.map((value) => (
              <Pill
                key={`type-pill-${value}`}
                data-test-id={`type-pill-${value}`}
                label={value}
                isDraggable={false}
                onClose={() => handleToggleFilter(value, false, setTypeFilter)}
              />
            ))}
            {statusFilter.map((value) => (
              <Pill
                key={`status-pill-${value}`}
                data-test-id={`status-pill-${value}`}
                label={value}
                isDraggable={false}
                onClose={() => handleToggleFilter(value, false, setStatusFilter)}
              />
            ))}
          </Stack>
        </Box>
      )}
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
