import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  IconButton,
  ModalConfirm,
  Note,
  Notification,
  Popover,
  SkeletonRow,
  Spinner,
  Table,
  Text,
  TextLink,
  ToggleButton,
  Tooltip,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { InfoIcon, TrayArrowDownIcon, MagnifyingGlassIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { resolveParameters } from '../../parameters';
import { OrphanTable } from './components/OrphanTable';
import { OrphanKind, OrphanResult, ScanProgress } from './types';
import { archiveOrphans, ArchiveProgress } from './utils/entryActions';
import { fetchAllContentTypes, findOrphans } from './utils/orphanFinder';

// Name what is being checked right now, e.g.
// "Checking Article, Author… (5/51)". Steps are content types plus the
// media-library pass, so the label does not say "content types".
const progressLabel = (progress: ScanProgress): string =>
  `Checking ${progress.stepNames.join(', ')}… (${progress.current}/${progress.total})`;

const pluralize = (count: number) => (count === 1 ? 'item' : 'items');

const countByKind = (items: OrphanResult[]) => ({
  entries: items.filter((result) => result.kind === 'entry').length,
  assets: items.filter((result) => result.kind === 'asset').length,
});

// "19 entries and 4 assets", "1 entry", … — used for the result count and
// the archive confirmation, so a mixed selection is always spelled out and
// select-all can never archive assets the user did not know were included.
const describeCounts = ({ entries, assets }: { entries: number; assets: number }): string => {
  const parts: string[] = [];
  if (entries > 0) parts.push(`${entries} ${entries === 1 ? 'entry' : 'entries'}`);
  if (assets > 0) parts.push(`${assets} ${assets === 1 ? 'asset' : 'assets'}`);
  return parts.length > 0 ? parts.join(' and ') : '0 items';
};

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
  // Per-run scan scope. Both on by default; the entry fan-out is the slow
  // part, so unchecking "Entries" gives a fast assets-only pass.
  const [scanEntries, setScanEntries] = useState(true);
  const [scanAssets, setScanAssets] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgress | null>(null);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [archiveInfoOpen, setArchiveInfoOpen] = useState(false);

  // Deep links into the web app's archived views — permanent deletion only
  // exists there, so the archive-info popover hands users the destination.
  // environmentAlias keeps the link on the alias the user is browsing under.
  // The filter uses the web app's shareable-view format: indexed key/op/val
  // triplets against the "__status" pseudo-field (empty op = equals).
  const archivedListUrls = useMemo(() => {
    const base = `https://app.contentful.com/spaces/${sdk.ids.space}/environments/${
      sdk.ids.environmentAlias ?? sdk.ids.environment
    }`;
    const archivedFilter = 'filters.0.key=__status&filters.0.op=&filters.0.val=archived';
    return {
      entries: `${base}/views/entries?${archivedFilter}`,
      assets: `${base}/views/assets?${archivedFilter}`,
    };
  }, [sdk]);

  const busy = scanning || archiving;
  const resultCounts = useMemo(() => countByKind(results ?? []), [results]);
  const selectedCounts = useMemo(
    () => countByKind((results ?? []).filter((result) => selectedIds.includes(result.id))),
    [results, selectedIds]
  );

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
      const outcome = await findOrphans(sdk.cma, contentTypes, sdk.locales.default, setProgress, {
        maxCandidates: parameters.maxCandidates,
        batchSize: parameters.batchSize,
        untouchedOnly: parameters.untouchedOnly,
        includeEntries: scanEntries,
        includeAssets: scanAssets,
      });
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
  }, [sdk, contentTypes, parameters, scanEntries, scanAssets]);

  const openResult = useCallback(
    (result: OrphanResult) => {
      // slideIn keeps the user on the results page while they inspect
      // (and possibly delete) the item in the standard editor.
      if (result.kind === 'entry') {
        sdk.navigator.openEntry(result.id, { slideIn: true });
      } else {
        sdk.navigator.openAsset(result.id, { slideIn: true });
      }
    },
    [sdk]
  );

  const toggleResult = useCallback((resultId: string) => {
    setSelectedIds((previous) =>
      previous.includes(resultId)
        ? previous.filter((id) => id !== resultId)
        : [...previous, resultId]
    );
  }, []);

  const toggleKind = useCallback(
    // Kind-scoped select-all with checkbox semantics: toggling on selects
    // every result of the kind (keeping any other-kind selection), toggling
    // off deselects exactly those again. "Archive all entries" is one click
    // and never sweeps assets along.
    (kind: OrphanKind) => {
      const kindIds = (results ?? [])
        .filter((result) => result.kind === kind)
        .map((result) => result.id);
      setSelectedIds((previous) => {
        const allOfKindSelected =
          kindIds.length > 0 && kindIds.every((id) => previous.includes(id));
        const withoutKind = previous.filter((id) => !kindIds.includes(id));
        return allOfKindSelected ? withoutKind : [...withoutKind, ...kindIds];
      });
    },
    [results]
  );

  const toggleAll = useCallback(() => {
    // Header checkbox: everything selected clears the selection, anything
    // less (none or partial) selects all visible results.
    setSelectedIds((previous) =>
      results !== null && previous.length < results.length ? results.map((result) => result.id) : []
    );
  }, [results]);

  const runArchive = useCallback(async () => {
    setConfirmArchiveOpen(false);
    setArchiving(true);
    try {
      // The archive endpoint differs per kind, so selection ids are resolved
      // back to results to recover whether each is an entry or an asset.
      const targets = (results ?? [])
        .filter((result) => selectedIds.includes(result.id))
        .map((result) => ({ id: result.id, kind: result.kind }));
      const outcome = await archiveOrphans(
        sdk.cma,
        targets,
        parameters.batchSize,
        setArchiveProgress
      );
      // Archived items leave the result list; failed ones stay visible and
      // selected so the user can retry them.
      setResults(
        (previous) => previous?.filter((result) => !outcome.archivedIds.includes(result.id)) ?? null
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
  }, [sdk, selectedIds, parameters, results]);

  return (
    // Full width: page apps get the whole main column, and the results table
    // benefits from every pixel of it.
    <Box padding="spacingXl">
      <Flex flexDirection="column" gap="spacingL">
        <Box>
          <Flex alignItems="center" gap="spacing2Xs">
            <Heading as="h1" marginBottom="none">
              Find orphaned entries
            </Heading>
            {/* The why-does-this-app-exist rationale lives in a tooltip so
                the header stays scannable; an IconButton (not a bare icon)
                keeps it reachable by keyboard and screen readers. */}
            <Tooltip
              content="The regular Contentful search can only filter on the title field for one content type at a time, because each content type defines its own display field. This scan runs that check across every content type — and the media library — at once."
              placement="right"
              maxWidth={400}>
              <IconButton
                variant="transparent"
                size="small"
                icon={<InfoIcon />}
                aria-label="Why this scan exists"
                testId="scan-info"
              />
            </Tooltip>
          </Flex>
          <Text as="p" fontColor="gray600">
            Finds untitled draft entries and media assets — usually created by accident from a
            reference field.
            {/* Whether the never-edited filter applies is decided in the app
                configuration, so the description must reflect the actual scan. */}
            {parameters.untouchedOnly && ' Only items never edited after creation are included.'}
          </Text>
        </Box>

        <Flex alignItems="center" gap="spacingM">
          <Button
            variant="primary"
            startIcon={<MagnifyingGlassIcon />}
            onClick={runScan}
            isDisabled={contentTypesLoading || busy || (!scanEntries && !scanAssets)}
            isLoading={scanning}
            testId="scan-button">
            {scanning ? 'Scanning…' : 'Scan for orphans'}
          </Button>
          {/* Per-run scope: the entry fan-out (one query per content type)
              is the slow part of a scan, so these let a user run a quick
              assets-only pass — or skip assets they do not care about. */}
          <Checkbox
            isChecked={scanEntries}
            onChange={(event) => setScanEntries(event.target.checked)}
            isDisabled={busy}
            testId="scope-entries">
            Entries
          </Checkbox>
          <Checkbox
            isChecked={scanAssets}
            onChange={(event) => setScanAssets(event.target.checked)}
            isDisabled={busy}
            testId="scope-assets">
            Media assets
          </Checkbox>
          {scanning && progress && (
            <Flex alignItems="center" gap="spacingXs">
              <Spinner size="small" />
              <Text fontColor="gray600">{progressLabel(progress)}</Text>
            </Flex>
          )}
        </Flex>

        {/* Separator between the scan controls and the results area, which
            below this line always renders something: placeholder, skeleton,
            empty note, or the results table. */}
        <Box style={{ borderBottom: `1px solid ${tokens.gray200}` }} />

        {results === null && !scanning && (
          // Fresh-open state: without this the area below the separator would
          // be blank until the first scan, which reads as something missing.
          <Flex
            flexDirection="column"
            alignItems="center"
            gap="spacingXs"
            padding="spacing2Xl"
            style={{
              border: `1px dashed ${tokens.gray300}`,
              borderRadius: tokens.borderRadiusMedium,
            }}
            testId="pre-scan-placeholder">
            <MagnifyingGlassIcon size="large" variant="muted" />
            <Text fontWeight="fontWeightDemiBold">No scan has run yet</Text>
            <Text fontColor="gray600">
              Click “Scan for orphans” to check every content type and the media library for
              untitled drafts.
            </Text>
          </Flex>
        )}

        {scanning && (
          // Placeholder rows keep the results area occupied while the scan
          // runs; the row count is arbitrary, it only suggests a table.
          <Table testId="scan-skeleton">
            <Table.Body>
              <SkeletonRow rowCount={3} columnCount={7} />
            </Table.Body>
          </Table>
        )}

        {truncated && (
          <Note variant="warning">
            The scan stopped after {parameters.maxCandidates} draft items. Archive or clean up some
            of the results and scan again, or raise the limit in the app configuration.
          </Note>
        )}

        {results !== null &&
          (results.length === 0 ? (
            <Note variant="positive" testId="empty-note">
              No orphans found — every scanned draft has a title.
            </Note>
          ) : (
            <>
              <Flex alignItems="center" justifyContent="space-between">
                <Flex alignItems="center" gap="spacingM">
                  <Text fontWeight="fontWeightDemiBold" testId="result-count">
                    {describeCounts(resultCounts)} found
                    {selectedIds.length > 0 ? ` — ${selectedIds.length} selected` : ''}
                  </Text>
                  {/* Kind-scoped select-all, only useful (and only shown)
                      when the results actually mix entries and assets. The
                      pressed state mirrors the real selection, so the
                      buttons also read as "everything of this kind is
                      selected" and toggle off to undo exactly that. */}
                  {resultCounts.entries > 0 && resultCounts.assets > 0 && (
                    <Flex alignItems="center" gap="spacingXs">
                      <Text fontColor="gray600">Select all</Text>
                      <ToggleButton
                        size="small"
                        isActive={selectedCounts.entries === resultCounts.entries}
                        onToggle={() => toggleKind('entry')}
                        isDisabled={busy}
                        testId="select-entries">
                        Entries ({resultCounts.entries})
                      </ToggleButton>
                      <ToggleButton
                        size="small"
                        isActive={selectedCounts.assets === resultCounts.assets}
                        onToggle={() => toggleKind('asset')}
                        isDisabled={busy}
                        testId="select-assets">
                        Assets ({resultCounts.assets})
                      </ToggleButton>
                    </Flex>
                  )}
                </Flex>
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
                  {/* Archiving reads as scary-destructive next to a negative
                      button; this spells out that it is reversible and links
                      straight to where actual deletion lives. A click
                      Popover, not a Tooltip: a hover tooltip closes before
                      its links can be clicked. */}
                  <Popover
                    isOpen={archiveInfoOpen}
                    onClose={() => setArchiveInfoOpen(false)}
                    placement="top-end">
                    <Popover.Trigger>
                      <IconButton
                        variant="transparent"
                        size="small"
                        icon={<InfoIcon />}
                        aria-label="What archiving does"
                        onClick={() => setArchiveInfoOpen((previous) => !previous)}
                        testId="archive-info"
                      />
                    </Popover.Trigger>
                    <Popover.Content>
                      <Box padding="spacingM" style={{ maxWidth: '340px' }}>
                        <Text as="p" marginBottom="spacingS">
                          Archiving is not deleting: archived items just leave the content list and
                          media library, and can be unarchived at any time.
                        </Text>
                        <Text as="p">
                          To delete them permanently, open the{' '}
                          <TextLink
                            href={archivedListUrls.entries}
                            target="_blank"
                            rel="noopener noreferrer"
                            testId="archived-entries-link">
                            archived entries
                          </TextLink>{' '}
                          or{' '}
                          <TextLink
                            href={archivedListUrls.assets}
                            target="_blank"
                            rel="noopener noreferrer"
                            testId="archived-assets-link">
                            archived assets
                          </TextLink>{' '}
                          list (opens in a new tab), select the items, and delete them there.
                        </Text>
                      </Box>
                    </Popover.Content>
                  </Popover>
                </Flex>
              </Flex>
              <OrphanTable
                results={results}
                selectedIds={selectedIds}
                onToggleResult={toggleResult}
                onToggleAll={toggleAll}
                onOpenResult={openResult}
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
        // The confirmation always itemizes the selection by kind, so a
        // select-all that swept in assets (or entries) is visible right on
        // the button before anything is archived.
        confirmLabel={`Archive ${describeCounts(selectedCounts)}`}
        cancelLabel="Cancel">
        <Text>
          The selected {describeCounts(selectedCounts)} will be archived and disappear from the
          content list and media library. Archiving is reversible: anything archived can be
          unarchived from its editor at any time.
        </Text>
      </ModalConfirm>
    </Box>
  );
};

export default Page;
