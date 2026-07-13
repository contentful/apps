import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  Heading,
  ModalConfirm,
  Note,
  Notification,
  Paragraph,
  Spinner,
  Text,
} from '@contentful/f36-components';
import { TrayArrowDownIcon, MagnifyingGlassIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { resolveParameters } from '../../parameters';
import { OrphanTable } from './components/OrphanTable';
import { OrphanResult, ScanProgress } from './types';
import { archiveEntries, ArchiveProgress } from './utils/entryActions';
import { fetchAllContentTypes, findOrphanedEntries } from './utils/orphanFinder';

// Name what is being checked right now, e.g.
// "Checking Article, Author… (5/50 content types)".
const progressLabel = (progress: ScanProgress): string =>
  `Checking ${progress.contentTypeNames.join(', ')}… (${progress.current}/${
    progress.total
  } content types)`;

const pluralize = (count: number) => (count === 1 ? 'entry' : 'entries');

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  // Installation parameters may be empty (fresh install, or the app was
  // installed before the config screen existed), so merge with defaults.
  const parameters = useMemo(
    () => resolveParameters(sdk.parameters.installation),
    [sdk.parameters.installation]
  );
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [contentTypesLoading, setContentTypesLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  // null means "no scan has run yet", which hides the results section
  // entirely; an empty array renders the positive empty state instead.
  const [results, setResults] = useState<OrphanResult[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgress | null>(null);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  const busy = scanning || archiving;

  // Content types are loaded once up front: the scan needs their display
  // field definitions, and the list rarely changes within a session.
  useEffect(() => {
    const loadContentTypes = async () => {
      try {
        setContentTypes(await fetchAllContentTypes(sdk.cma));
      } catch (error) {
        console.error('Loading content types failed:', error);
        Notification.error('Could not load content types. Please reload the app.');
      } finally {
        setContentTypesLoading(false);
      }
    };
    loadContentTypes();
  }, [sdk.cma]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setResults(null);
    setTruncated(false);
    // A new scan invalidates any previous selection.
    setSelectedIds([]);
    try {
      const outcome = await findOrphanedEntries(
        sdk.cma,
        contentTypes,
        sdk.locales.default,
        setProgress,
        {
          maxCandidates: parameters.maxCandidates,
          batchSize: parameters.batchSize,
          untouchedOnly: parameters.untouchedOnly,
        }
      );
      setResults(outcome.results);
      setTruncated(outcome.truncated);
    } catch (error) {
      // CMA calls run through the app bridge in the parent window, so a
      // failure here may leave no trace in the iframe's network tab; this
      // log is the only place the underlying error is visible.
      console.error('Orphan scan failed:', error);
      Notification.error('The scan failed. Please try again.');
    } finally {
      setScanning(false);
      setProgress(null);
    }
  }, [sdk, contentTypes, parameters]);

  const openEntry = useCallback(
    (entryId: string) => {
      // slideIn keeps the user on the results page while they inspect
      // (and possibly delete) the entry in the standard editor.
      sdk.navigator.openEntry(entryId, { slideIn: true });
    },
    [sdk]
  );

  const toggleEntry = useCallback((entryId: string) => {
    setSelectedIds((previous) =>
      previous.includes(entryId) ? previous.filter((id) => id !== entryId) : [...previous, entryId]
    );
  }, []);

  const toggleAll = useCallback(() => {
    // Header checkbox: everything selected clears the selection, anything
    // less (none or partial) selects all visible results.
    setSelectedIds((previous) =>
      results !== null && previous.length < results.length
        ? results.map((result) => result.entry.sys.id)
        : []
    );
  }, [results]);

  const runArchive = useCallback(async () => {
    setConfirmArchiveOpen(false);
    setArchiving(true);
    try {
      const outcome = await archiveEntries(
        sdk.cma,
        selectedIds,
        parameters.batchSize,
        setArchiveProgress
      );
      // Archived entries leave the result list; failed ones stay visible and
      // selected so the user can retry them.
      setResults(
        (previous) =>
          previous?.filter((result) => !outcome.archivedIds.includes(result.entry.sys.id)) ?? null
      );
      setSelectedIds(outcome.failedIds);
      if (outcome.archivedIds.length > 0) {
        Notification.success(
          `Archived ${outcome.archivedIds.length} ${pluralize(outcome.archivedIds.length)}.`
        );
      }
      if (outcome.failedIds.length > 0) {
        Notification.error(
          `Could not archive ${outcome.failedIds.length} ${pluralize(
            outcome.failedIds.length
          )}. They remain selected so you can try again.`
        );
      }
    } catch {
      Notification.error('Archiving failed. Please try again.');
    } finally {
      setArchiving(false);
      setArchiveProgress(null);
    }
  }, [sdk, selectedIds, parameters]);

  return (
    // Full width: page apps get the whole main column, and the results table
    // benefits from every pixel of it.
    <Box padding="spacingXl">
      <Heading as="h1">Find orphaned entries</Heading>
      <Paragraph>
        Finds draft entries with no value in their display (title) field — the signature of an entry
        created by mistake, for example by adding a new entry on a reference field instead of
        linking an existing one.
        {/* Whether the never-edited filter applies is decided in the app
            configuration, so the description must reflect the actual scan. */}
        {parameters.untouchedOnly &&
          ' Only entries that were never edited after creation are included.'}
      </Paragraph>

      <Flex flexDirection="column" gap="spacingL">
        <Note variant="neutral">
          The regular Contentful search can only filter on the title field for one content type at a
          time, because each content type defines its own display field. This scan runs that check
          across every content type at once.
        </Note>

        <Flex alignItems="center" gap="spacingM">
          <Button
            variant="primary"
            startIcon={<MagnifyingGlassIcon />}
            onClick={runScan}
            isDisabled={contentTypesLoading || busy}
            isLoading={scanning}
            testId="scan-button">
            {scanning ? 'Scanning…' : 'Scan for orphans'}
          </Button>
          {scanning && progress && (
            <Flex alignItems="center" gap="spacingXs">
              <Spinner size="small" />
              <Text fontColor="gray600">{progressLabel(progress)}</Text>
            </Flex>
          )}
        </Flex>

        {truncated && (
          <Note variant="warning">
            The scan stopped after {parameters.maxCandidates} draft entries. Archive or clean up
            some of the results and scan again, or raise the limit in the app configuration.
          </Note>
        )}

        {results !== null &&
          (results.length === 0 ? (
            <Note variant="positive" testId="empty-note">
              No orphaned entries found — every draft has a title.
            </Note>
          ) : (
            <>
              <Flex alignItems="center" justifyContent="space-between">
                <Text fontWeight="fontWeightDemiBold" testId="result-count">
                  {results.length} {pluralize(results.length)} found
                  {selectedIds.length > 0 ? ` — ${selectedIds.length} selected` : ''}
                </Text>
                <Flex alignItems="center" gap="spacingM">
                  {archiving && archiveProgress && (
                    <Flex alignItems="center" gap="spacingXs">
                      <Spinner size="small" />
                      <Text fontColor="gray600">
                        Archiving… ({archiveProgress.current}/{archiveProgress.total})
                      </Text>
                    </Flex>
                  )}
                  <Button
                    variant="negative"
                    startIcon={<TrayArrowDownIcon />}
                    isDisabled={selectedIds.length === 0 || busy}
                    isLoading={archiving}
                    onClick={() => setConfirmArchiveOpen(true)}
                    testId="archive-button">
                    Archive selected
                  </Button>
                </Flex>
              </Flex>
              <OrphanTable
                results={results}
                selectedIds={selectedIds}
                onToggleEntry={toggleEntry}
                onToggleAll={toggleAll}
                onOpenEntry={openEntry}
                isDisabled={busy}
              />
            </>
          ))}
      </Flex>

      <ModalConfirm
        intent="negative"
        isShown={confirmArchiveOpen}
        onCancel={() => setConfirmArchiveOpen(false)}
        onConfirm={runArchive}
        confirmLabel={`Archive ${selectedIds.length} ${pluralize(selectedIds.length)}`}
        cancelLabel="Cancel">
        <Text>
          The selected {pluralize(selectedIds.length)} will be archived and disappear from the
          content list. Archiving is reversible: entries can be unarchived from the entry editor at
          any time.
        </Text>
      </ModalConfirm>
    </Box>
  );
};

export default Page;
