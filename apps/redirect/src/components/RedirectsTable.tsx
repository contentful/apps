import { useState, useMemo } from 'react';
import { Text, Flex, TextLink, Badge, RelativeDateTime } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { redirectsTableStyles as styles } from './RedirectsTable.styles';
import { ContentTable } from './ContentTable';
import { useRedirects } from '../hooks/useRedirects';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { Redirect, TableColumn } from '../utils/types';
import { EntryProps } from 'contentful-management';

export const RedirectsTable = () => {
  const sdk = useSDK<PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const { redirects, total, isFetchingRedirects, fetchingRedirectsError, refetchRedirects } =
    useRedirects(currentPage, itemsPerPage);

  const getEntryUrl = (sdk: PageAppSDK, entryId: string): string =>
    `${sdk.hostnames?.webapp ?? 'https://app.contentful.com'}/spaces/${
      sdk.ids.space
    }/environments/${sdk.ids.environment}/entries/${entryId}`;

  const handleEdit = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // todo: open edit modal
  };

  const defaultLocaleValue = sdk.locales.default || 'en-US';

  const columns = useMemo<TableColumn<EntryProps>[]>(
    () => [
      {
        id: 'source',
        label: 'Source',
        style: styles.sourceColumn,
        render: (item) => (
          <Flex flexDirection="column" alignItems="start" gap="spacing2Xs">
            <TextLink
              href={getEntryUrl(sdk, item.fields.redirectFrom[defaultLocaleValue].sys.id)}
              icon={<ArrowSquareOutIcon />}
              alignIcon="end">
              {item.fields.redirectFrom[defaultLocaleValue].sys.title ?? 'Untitled'}
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
              href={getEntryUrl(sdk, item.fields.redirectTo[defaultLocaleValue].sys.id)}
              icon={<ArrowSquareOutIcon />}
              alignIcon="end">
              {item.fields.redirectTo[defaultLocaleValue].sys.title ?? 'Untitled'}
            </TextLink>
            <Text fontColor="gray500">/slug</Text>
          </Flex>
        ),
      },
      {
        id: 'reason',
        label: 'Reason',
        style: styles.reasonColumn,
        render: (item) => item.fields.reason[defaultLocaleValue] ?? '—',
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
            {item.fields.active[defaultLocaleValue].value ? 'Active' : 'Inactive'}
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
        render: (item) => (
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
