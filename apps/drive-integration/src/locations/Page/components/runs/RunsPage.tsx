import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Note,
  Paragraph,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@contentful/f36-components';
import { CaretDownIcon, SortAscendingIcon, SortDescendingIcon } from '@contentful/f36-icons';
import { PageAppSDK } from '@contentful/app-sdk';
import { useState } from 'react';
import { useRunsPolling } from '../../../../hooks/useRunsPolling';
import { DisplayStatus } from '../../../../types/runs';
import type { RunRecord, RunWithStatus } from '../../../../types/runs';
import { RunRow } from './RunRow';
import { OAuthConnector } from '../mainpage/OAuthConnector';

type SortOrder = 'newest' | 'oldest';

const STATUS_OPTIONS: { value: DisplayStatus; label: string }[] = [
  { value: DisplayStatus.RUNNING, label: 'In progress' },
  { value: DisplayStatus.NEEDS_REVIEW, label: 'Ready for review' },
  { value: DisplayStatus.COMPLETED, label: 'Complete' },
  { value: DisplayStatus.FAILED, label: 'Failed' },
  { value: DisplayStatus.EXPIRED, label: 'Expired' },
];

const ALL_STATUSES = new Set(STATUS_OPTIONS.map((o) => o.value));

interface RunsPageProps {
  sdk: PageAppSDK;
  runs: RunRecord[];
  removeRun: (runId: string) => void;
  storageError: string | null;
  onStartImport: () => void;
  onReviewRun: (runId: string) => void;
  onRetryRun: (runId: string) => Promise<void>;
  isOAuthConnected: boolean;
  isOAuthBusy: boolean;
  onConnectGoogleDrive: () => Promise<void>;
  onDisconnectGoogleDrive: () => Promise<void>;
}

export function RunsPage({
  sdk,
  runs,
  removeRun,
  storageError,
  onStartImport,
  onReviewRun,
  onRetryRun,
  isOAuthConnected,
  isOAuthBusy,
  onConnectGoogleDrive,
  onDisconnectGoogleDrive,
}: RunsPageProps) {
  const spaceId = sdk.ids.space;
  const webappHost = sdk.hostnames.webapp ?? 'app.contentful.com';
  const [visibleStatuses, setVisibleStatuses] = useState<Set<DisplayStatus>>(new Set(ALL_STATUSES));
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const toggleStatus = (status: DisplayStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const isFiltered = visibleStatuses.size < ALL_STATUSES.size;

  const { statusMap, errorMap, titleMap } = useRunsPolling(runs, sdk);

  const runsWithStatus: RunWithStatus[] = runs.map((r) => ({
    ...r,
    documentTitle: titleMap.get(r.runId) ?? r.documentTitle,
    displayStatus: statusMap.get(r.runId) ?? DisplayStatus.LOADING,
    errorMessage: errorMap.get(r.runId),
  }));

  const filtered = runsWithStatus
    .filter((r) => visibleStatuses.has(r.displayStatus))
    .sort((a, b) => {
      const diff = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });

  return (
    <Box padding="spacingL" style={{ maxWidth: '1200px' }}>
      {/* Page header */}
      <Flex justifyContent="space-between" alignItems="flex-start" marginBottom="spacingM">
        <Box>
          <Heading marginBottom="none">Drive Integration</Heading>
          <Paragraph marginBottom="none" style={{ color: 'var(--color-text-light)' }}>
            Create entries using existing content types from a Google Drive file.
          </Paragraph>
        </Box>
        <OAuthConnector
          isOAuthConnected={isOAuthConnected}
          isOAuthBusy={isOAuthBusy}
          onConnect={onConnectGoogleDrive}
          onDisconnect={onDisconnectGoogleDrive}
        />
      </Flex>

      {/* Intro / select file card */}
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap="spacingL"
        padding="spacingM"
        marginBottom="spacingL"
        style={{
          border: '1px solid #CFD9E0',
          borderRadius: '6px',
          background: '#fff',
        }}>
        <Text style={{ maxWidth: '600px' }}>
          Select a Google Doc file to begin. This app only creates new entries; existing entries
          must be linked after drafts are created. Sheets, Slides, and PDFs aren&apos;t supported.
        </Text>
        <Button
          variant="primary"
          size="small"
          isDisabled={!isOAuthConnected}
          onClick={onStartImport}
          style={{ flexShrink: 0 }}>
          Select file
        </Button>
      </Flex>

      {/* Storage error */}
      {storageError && (
        <Box marginBottom="spacingM">
          <Note variant="negative">{storageError}</Note>
        </Box>
      )}

      {runs.length > 0 && (
        <>
          {/* Status label + filters */}
          <Flex
            flexDirection="column"
            alignItems="flex-start"
            gap="spacingS"
            marginBottom="spacingS">
            <Text fontWeight="fontWeightMedium">Status</Text>
            <Flex gap="spacingS">
              <Popover isOpen={filterOpen} onClose={() => setFilterOpen(false)}>
                <Popover.Trigger>
                  <button
                    onClick={() => setFilterOpen((o) => !o)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '200px',
                      padding: '8px 14px',
                      background: '#fff',
                      border: `1px solid ${isFiltered ? '#0059C8' : '#CFD9E0'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: isFiltered ? '#0059C8' : '#536171',
                      fontSize: '14px',
                      gap: '8px',
                    }}>
                    <span>
                      {isFiltered
                        ? `Showing ${visibleStatuses.size} of ${ALL_STATUSES.size}`
                        : 'View all'}
                    </span>
                    <CaretDownIcon size="small" />
                  </button>
                </Popover.Trigger>
                <Popover.Content>
                  <Flex
                    flexDirection="column"
                    gap="spacingXs"
                    padding="spacingS"
                    style={{ minWidth: '180px' }}>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <Checkbox
                        key={value}
                        isChecked={visibleStatuses.has(value)}
                        onChange={() => toggleStatus(value)}>
                        {label}
                      </Checkbox>
                    ))}
                  </Flex>
                </Popover.Content>
              </Popover>
              <Popover isOpen={sortOpen} onClose={() => setSortOpen(false)}>
                <Popover.Trigger>
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      background: '#fff',
                      border: '1px solid #CFD9E0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#536171',
                      fontSize: '14px',
                    }}>
                    {sortOrder === 'newest' ? (
                      <SortDescendingIcon size="small" />
                    ) : (
                      <SortAscendingIcon size="small" />
                    )}
                    <span>Sort by</span>
                    <CaretDownIcon size="small" />
                  </button>
                </Popover.Trigger>
                <Popover.Content>
                  <Flex flexDirection="column" style={{ minWidth: '160px' }}>
                    {(['newest', 'oldest'] as SortOrder[]).map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setSortOrder(value);
                          setSortOpen(false);
                        }}
                        style={{
                          padding: '10px 16px',
                          background: sortOrder === value ? '#F7F9FA' : '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '14px',
                          color: sortOrder === value ? '#0059C8' : '#2A3039',
                          fontWeight: sortOrder === value ? 500 : 400,
                        }}>
                        {value === 'newest' ? 'Newest first' : 'Oldest first'}
                      </button>
                    ))}
                  </Flex>
                </Popover.Content>
              </Popover>
            </Flex>
          </Flex>

          <style>{`
            [data-test-id="cf-ui-table"] { border: none; box-shadow: none; }
            [data-test-id="cf-ui-table-row"] { box-shadow: none; }
            [data-test-id="cf-ui-table-row"]:not(:last-child) [data-test-id="cf-ui-table-cell"] { border-bottom: 1px solid #E5E8ED; }
            [data-test-id="cf-ui-table-head"] [data-test-id="cf-ui-table-row"] [data-test-id="cf-ui-table-cell"] { border-bottom: 1px solid #E5E8ED; }
          `}</style>

          {/* Table */}
          <Table style={{ border: 'none' }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell style={{ width: '140px' }}>Created</TableCell>
                <TableCell style={{ width: '160px' }}>Status</TableCell>
                <TableCell style={{ width: '80px' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Text fontColor="gray500">No imports match the selected filter.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((run) => (
                  <RunRow
                    key={run.runId}
                    run={run}
                    spaceId={spaceId}
                    webappHost={webappHost}
                    onReview={onReviewRun}
                    onRetry={onRetryRun}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}

      {runs.length === 0 && (
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="spacingM"
          style={{ minHeight: '200px' }}>
          <Text fontColor="gray500">No imports yet. Select a file above to get started.</Text>
        </Flex>
      )}
    </Box>
  );
}
