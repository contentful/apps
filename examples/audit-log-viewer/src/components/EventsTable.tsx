import { useState } from 'react';
import { Badge, Box, Button, Flex, Select, Table, Text } from '@contentful/f36-components';
import { ChevronLeftIcon, ChevronRightIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import type { AuditEvent } from '../lib/events';

const ACTIVITY_VARIANT: Record<
  string,
  'positive' | 'primary' | 'warning' | 'negative' | 'secondary'
> = {
  Create: 'positive',
  Publish: 'positive',
  Update: 'primary',
  Unpublish: 'warning',
  Delete: 'negative',
  Archive: 'negative',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const EventsTable = ({ events }: { events: AuditEvent[] }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  // Clamp: filtering can shrink events below the current page's offset.
  const maxPage = Math.max(0, Math.ceil(events.length / pageSize) - 1);
  const activePage = Math.min(page, maxPage);
  const pageEvents = events.slice(activePage * pageSize, (activePage + 1) * pageSize);
  const firstItem = activePage * pageSize + 1;
  const lastItem = Math.min((activePage + 1) * pageSize, events.length);
  return (
    <>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Time (UTC)</Table.Cell>
            <Table.Cell>Action</Table.Cell>
            <Table.Cell>Actor</Table.Cell>
            <Table.Cell>Entity</Table.Cell>
            <Table.Cell>Space</Table.Cell>
            <Table.Cell>Request</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {pageEvents.map((e, i) => (
            <Table.Row key={`${e.time}-${e.entityId}-${i}`}>
              <Table.Cell>
                <Text fontColor="colorTextMid" style={{ whiteSpace: 'nowrap' }}>
                  {e.timeIso.replace('T', ' ').slice(0, 19)}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge variant={ACTIVITY_VARIANT[e.activity] ?? 'secondary'}>{e.activity}</Badge>
              </Table.Cell>
              <Table.Cell>
                {e.actorName}
                {e.actorType === 'App' ? ' (app)' : ''}
              </Table.Cell>
              <Table.Cell>
                {e.entityType}
                {e.entityId ? ` · ${e.entityId}` : ''}
              </Table.Cell>
              <Table.Cell>{e.spaceName || '—'}</Table.Cell>
              <Table.Cell>
                <Text fontColor="colorTextLight" as="span">
                  {e.method} {e.path}
                </Text>
                {e.status ? ` → ${e.status}` : ''}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {events.length > 0 && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          marginTop="spacingM"
          marginBottom="spacingXl">
          <Flex alignItems="center" gap="spacingXs">
            <Text>Show</Text>
            <Select
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <Select.Option key={n} value={String(n)}>
                  {n}
                </Select.Option>
              ))}
            </Select>
          </Flex>
          <Flex alignItems="center" gap="spacingM">
            <Text style={{ color: tokens.colorTextMid }}>
              {firstItem} – {lastItem} of {events.length}
            </Text>
            <Button
              variant="secondary"
              size="small"
              startIcon={<ChevronLeftIcon />}
              isDisabled={activePage === 0}
              onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              size="small"
              endIcon={<ChevronRightIcon />}
              isDisabled={activePage >= maxPage}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};
