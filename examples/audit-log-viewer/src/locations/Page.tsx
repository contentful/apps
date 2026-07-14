import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Note,
  Select,
  Spinner,
  Text,
  TextInput,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EventsTable } from '../components/EventsTable';
import { ChartsPanel } from '../components/ChartsPanel';
import { useAuditLogs } from '../lib/useAuditLogs';
import { filterEvents } from '../lib/events';

const daysAgoIso = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { state, load } = useAuditLogs(sdk);
  const [startDate, setStartDate] = useState(daysAgoIso(14));
  const [endDate, setEndDate] = useState(daysAgoIso(1));
  const [actor, setActor] = useState('');
  const [activity, setActivity] = useState('');
  const [space, setSpace] = useState('');
  const [query, setQuery] = useState('');

  const events = state.status === 'ready' ? state.events : [];
  const actors = useMemo(() => [...new Set(events.map((e) => e.actorName))].sort(), [events]);
  const activities = useMemo(() => [...new Set(events.map((e) => e.activity))].sort(), [events]);
  const spaceOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of events) if (e.spaceId) m.set(e.spaceId, e.spaceName || e.spaceId);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [events]);
  const filtered = useMemo(
    () => filterEvents(events, { actor, activity, spaceId: space, query }),
    [events, actor, activity, space, query],
  );

  return (
    <Box padding="spacingXl" style={{ width: '100%', minHeight: '100vh', backgroundColor: tokens.colorWhite }}>
      <Heading as="h1" marginBottom="none">Audit Log Viewer</Heading>
      <Text style={{ color: tokens.colorTextMid }}>
        Track who made changes across your organization — browse by date range to get started.
      </Text>

      <Flex gap="spacingM" alignItems="flex-end" marginTop="spacingL" marginBottom="spacingL">
        <FormControl marginBottom="none">
          <FormControl.Label>Start date</FormControl.Label>
          <TextInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FormControl>
        <FormControl marginBottom="none">
          <FormControl.Label>End date</FormControl.Label>
          <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </FormControl>
        <Button
          variant="primary"
          isDisabled={state.status === 'loading' || !startDate || !endDate}
          onClick={() => {
            // Stale filters from a previous load can silently hide fresh results.
            setActor('');
            setActivity('');
            setSpace('');
            setQuery('');
            load(startDate, endDate);
          }}
        >
          Load logs
        </Button>
      </Flex>

      {state.status === 'loading' && (
        <Flex gap="spacingS" alignItems="center">
          <Spinner />
          <Text>
            {state.total === 0
              ? 'Loading…'
              : `Loading logs… (${state.done} of ${state.total})`}
          </Text>
        </Flex>
      )}
      {state.status === 'error' && (
        <Note variant="negative" title="Could not load audit logs">
          {state.message}
        </Note>
      )}
      {state.status === 'ready' && (
        <>
          {state.truncated && (
            <Note variant="warning" title="Result truncated">
              More log files matched than the per-request limit. Narrow the date range to see
              everything.
            </Note>
          )}
          {state.failedFiles.length > 0 && (
            <Note variant="warning" title={`${state.failedFiles.length} file(s) failed to load`}>
              Files can fail to download if the bucket CORS configuration is missing (see the app
              configuration screen) or if the download outlived the 15-minute pre-signed URL
              window — reload, or try a narrower date range.
            </Note>
          )}
          {filtered.length === 0 ? (
            <Note title="No events">No audit events match the current range and filters.</Note>
          ) : (
            <>
              <ChartsPanel events={filtered} />
              <Box marginTop="spacingL">
                <Flex gap="spacingS" marginBottom="spacingM" alignItems="center">
                  <TextInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by actor, entity, path…"
                    style={{ flex: 1 }}
                  />
                  <Select value={space} onChange={(e) => setSpace(e.target.value)}>
                    <Select.Option value="">Space</Select.Option>
                    {spaceOptions.map(([id, name]) => (
                      <Select.Option key={id} value={id}>{name}</Select.Option>
                    ))}
                  </Select>
                  <Select value={actor} onChange={(e) => setActor(e.target.value)}>
                    <Select.Option value="">Actor</Select.Option>
                    {actors.map((a) => (
                      <Select.Option key={a} value={a}>{a}</Select.Option>
                    ))}
                  </Select>
                  <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
                    <Select.Option value="">Action</Select.Option>
                    {activities.map((a) => (
                      <Select.Option key={a} value={a}>{a}</Select.Option>
                    ))}
                  </Select>
                  <Text style={{ color: tokens.colorTextLight, whiteSpace: 'nowrap' }}>
                    {filtered.length} event{filtered.length === 1 ? '' : 's'}
                  </Text>
                </Flex>
                <EventsTable events={filtered} />
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default Page;
