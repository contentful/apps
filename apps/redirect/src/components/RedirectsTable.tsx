import { useState, useMemo } from 'react';
import { Text, Flex, TextLink, Badge, RelativeDateTime } from '@contentful/f36-components';
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

export const RedirectsTable = () => {
  const sdk = useSDK<PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const { redirects, total, isFetchingRedirects, fetchingRedirectsError, refetchRedirects } =
    useRedirects(currentPage, itemsPerPage);

  const handleEdit = () => {
    // todo: open edit modal
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
        render: (item) => truncateText(item.fields.reason[sdk.locales.default] ?? '—', 180),
      },
      {
        id: 'type',
        label: 'Type',
        style: styles.typeColumn,
        render: (item) => item.fields.redirectType[sdk.locales.default] ?? '—',
      },
      {
        id: 'status',
        label: 'Status',
        style: styles.statusColumn,
        render: (item) => (
          <Badge variant={item.fields.active[sdk.locales.default] ? 'positive' : 'warning'}>
            {item.fields.active[sdk.locales.default] ? 'Active' : 'Inactive'}
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
  );
};
