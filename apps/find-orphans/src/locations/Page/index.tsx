import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  ModalConfirm,
  Note,
  Notification,
  Pagination,
  SkeletonRow,
  Spinner,
  Table,
  Tabs,
  Text,
  TextLink,
  ToggleButton,
  Tooltip,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {
  DownloadSimpleIcon,
  InfoIcon,
  LinkBreakIcon,
  TrayArrowDownIcon,
  MagnifyingGlassIcon,
} from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { resolveParameters } from '../../parameters';
import { OrphanTable } from './components/OrphanTable';
import { OrphanKind, OrphanResult, ScanCriterion, ScanProgress } from './types';
import { RESULTS_PAGE_SIZE } from './utils/constants';
import { archiveOrphans, ArchiveProgress } from './utils/entryActions';
import { buildOrphanCsv, downloadCsv } from './utils/exportCsv';
import { fetchAllContentTypes, findOrphans } from './utils/orphanFinder';

// Name what is being checked right now, e.g.
// "Checking Article, Author… (5/51)". Steps are content types plus the
// media-library pass (or reference counts), so the label stays generic.
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

/**
 * Everything one criterion's tab remembers. Each tab keeps its own results,
 * selection, and filter, so switching between the untitled and unreferenced
 * tabs never discards or re-runs a scan.
 */
interface TabState {
  results: OrphanResult[] | null;
  truncated: boolean;
  selectedIds: string[];
  /**
   * The "Never edited" results filter. The scan is always broad; this only
   * narrows what is displayed (and selectable), so nothing is ever silently
   * excluded — the toggle shows how many results it is holding back.
   */
  neverEditedOnly: boolean;
  /**
   * Zero-based results-table page. Pagination is navigation, not a
   * view-narrowing filter: rows on other pages stay selected and archivable.
   * The page resets to 0 whenever the displayed set is reshaped (new scan,
   * scope or never-edited change) and is clamped at render time when rows
   * disappear underneath it (archiving).
   */
  page: number;
}

/** Reset applied when a scan starts: results clear, the filter persists. */
const SCAN_RESET = { results: null, truncated: false, selectedIds: [], page: 0 };

/**
 * Static per-criterion UI copy and chrome. The description is shown inside
 * the tab's panel above its scan button, so it is always visible before the
 * scan can be started — switching tabs is free (results are cached), which
 * is also why the tab labels carry no explainer of their own.
 */
const CRITERIA: Record<
  ScanCriterion,
  {
    tabLabel: string;
    scanLabel: string;
    /** Rendered inside gray Text; JSX so key caveats can carry emphasis. */
    description: ReactNode;
    icon: JSX.Element;
    emptyNote: string;
  }
> = {
  untitled: {
    tabLabel: 'Untitled drafts',
    scanLabel: 'Scan for untitled drafts',
    description: (
      <Text as="p" fontColor="gray600">
        Untitled items are the signature of something created by accident — for example by adding a
        new entry on a reference field instead of linking an existing one — and abandoned.
      </Text>
    ),
    icon: <MagnifyingGlassIcon />,
    emptyNote: 'No orphans found — every scanned draft has a title.',
  },
  unreferenced: {
    tabLabel: 'Unreferenced drafts',
    scanLabel: 'Scan for unreferenced drafts',
    description: (
      <>
        <Text as="p" fontColor="gray600" marginBottom="spacingS">
          Checking references cannot be done in bulk — this scan makes one network request per
          draft, so it can take several minutes on large spaces. It finds items that no entry links
          to.
        </Text>
        {/* The caveat gets its own paragraph so it cannot be skimmed past. */}
        <Text as="p" fontColor="gray600">
          <strong>Being unreferenced is not proof of junk</strong> — top-level content like landing
          pages is often never referenced yet perfectly valid — so treat these results as leads for
          possibly unused content and review each one before archiving.
        </Text>
      </>
    ),
    icon: <LinkBreakIcon />,
    emptyNote: 'No orphans found — every scanned draft is referenced by at least one entry.',
  },
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
  // Which scan is currently running (null = none). Scans are exclusive:
  // both buttons disable while one runs, and the spinner shows on the
  // running one.
  const [activeScan, setActiveScan] = useState<ScanCriterion | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [activeTab, setActiveTab] = useState<ScanCriterion>('untitled');
  // One cached state per criterion tab; `results: null` means "this tab has
  // not scanned yet" and renders the placeholder instead of a table. The
  // untitled tab starts on the strict never-edited view (the confident-junk
  // subset; "All" is one visible click away); the unreferenced tab always
  // starts broad (edit history says nothing about referenced-ness).
  const [tabStates, setTabStates] = useState<Record<ScanCriterion, TabState>>({
    untitled: { ...SCAN_RESET, neverEditedOnly: true },
    unreferenced: { ...SCAN_RESET, neverEditedOnly: false },
  });
  // Per-run scan scope, shared by both tabs. Both on by default; the entry
  // fan-out is the slow part, so unchecking "Entries" gives a fast
  // assets-only pass.
  const [scanEntries, setScanEntries] = useState(true);
  const [scanAssets, setScanAssets] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgress | null>(null);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  // Deep links into the web app's archived views — permanent deletion only
  // exists there, so the archive confirmation hands users the destination.
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

  const scanning = activeScan !== null;
  const busy = scanning || archiving;
  const currentTab = tabStates[activeTab];
  // What the table (and every selection action) actually operates on: the
  // tab's results narrowed by the scope checkboxes (which double as live
  // client-side filters on cached results) and the "Never edited" view.
  const displayedResults = useMemo(
    () =>
      (currentTab.results ?? []).filter(
        (result) =>
          (result.kind === 'entry' ? scanEntries : scanAssets) &&
          (!currentTab.neverEditedOnly || result.neverEdited)
      ),
    [currentTab.results, currentTab.neverEditedOnly, scanEntries, scanAssets]
  );
  const selectedCounts = useMemo(
    () =>
      countByKind(displayedResults.filter((result) => currentTab.selectedIds.includes(result.id))),
    [displayedResults, currentTab.selectedIds]
  );

  const patchTab = useCallback((criterion: ScanCriterion, patch: Partial<TabState>) => {
    setTabStates((previous) => ({
      ...previous,
      [criterion]: { ...previous[criterion], ...patch },
    }));
  }, []);

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

  const runScan = useCallback(
    async (criterion: ScanCriterion) => {
      setActiveScan(criterion);
      // A new scan replaces this tab's results and invalidates its
      // selection; the tab's filter and the other tab's cache are untouched.
      patchTab(criterion, SCAN_RESET);
      try {
        const outcome = await findOrphans(sdk.cma, contentTypes, sdk.locales.default, setProgress, {
          criterion,
          maxCandidates: parameters.maxCandidates,
          batchSize: parameters.batchSize,
          includeEntries: scanEntries,
          includeAssets: scanAssets,
        });
        patchTab(criterion, { results: outcome.results, truncated: outcome.truncated });
      } catch (error) {
        // CMA calls run through the app bridge in the parent window, so a
        // failure here may leave no trace in the iframe's network tab; this
        // log is the only place the underlying error is visible.
        console.error('Orphan scan failed:', error);
        Notification.error('The scan failed. Please try again.');
      } finally {
        setActiveScan(null);
        setProgress(null);
      }
    },
    [sdk, contentTypes, parameters, scanEntries, scanAssets, patchTab]
  );

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

  const toggleResult = useCallback(
    (resultId: string) => {
      patchTab(activeTab, {
        selectedIds: currentTab.selectedIds.includes(resultId)
          ? currentTab.selectedIds.filter((id) => id !== resultId)
          : [...currentTab.selectedIds, resultId],
      });
    },
    [activeTab, currentTab.selectedIds, patchTab]
  );

  const toggleAll = useCallback(() => {
    // Header checkbox: everything selected clears the selection, anything
    // less (none or partial) selects all displayed results — across every
    // page, not just the rendered one, so "archive all N" is one click. The
    // count line and the archive confirmation spell out the full selection.
    patchTab(activeTab, {
      selectedIds:
        currentTab.selectedIds.length < displayedResults.length
          ? displayedResults.map((result) => result.id)
          : [],
    });
  }, [activeTab, currentTab, displayedResults, patchTab]);

  const setScope = useCallback(
    // The scope checkboxes are dual-purpose: they decide what the next scan
    // fetches AND live-filter already-scanned results. Unchecking a kind
    // hides its rows, so — like every view change — it must deselect them,
    // in both tabs, since the scope is shared.
    (kind: OrphanKind, checked: boolean) => {
      if (kind === 'entry') {
        setScanEntries(checked);
      } else {
        setScanAssets(checked);
      }
      // Any scope change reshapes the displayed list in both tabs (the scope
      // is shared), so both go back to the first page; unchecking
      // additionally deselects the kind's now-hidden rows.
      setTabStates((previous) => {
        const adjust = (tab: TabState): TabState => ({
          ...tab,
          page: 0,
          selectedIds: checked
            ? tab.selectedIds
            : tab.selectedIds.filter((id) =>
                (tab.results ?? []).some((result) => result.id === id && result.kind !== kind)
              ),
        });
        return { untitled: adjust(previous.untitled), unreferenced: adjust(previous.unreferenced) };
      });
    },
    []
  );

  const setNeverEditedFilter = useCallback(
    // The two view pills act like radios: clicking the already-active one
    // is a no-op, never an off-switch, so the current view is always the
    // pressed pill.
    (neverEditedOnly: boolean) => {
      if (neverEditedOnly === currentTab.neverEditedOnly) return;
      patchTab(activeTab, {
        neverEditedOnly,
        // Switching views reshapes the displayed list, so start it over
        // from its first page.
        page: 0,
        // Narrowing the view must narrow the selection too — otherwise
        // "Archive selected" could archive rows the user can no longer see.
        selectedIds: neverEditedOnly
          ? currentTab.selectedIds.filter((id) =>
              (currentTab.results ?? []).some((result) => result.id === id && result.neverEdited)
            )
          : currentTab.selectedIds,
      });
    },
    [activeTab, currentTab, patchTab]
  );

  const exportResults = useCallback(
    (criterion: ScanCriterion) => {
      // The export is broad like the scan: the tab's full cached results,
      // including rows the scope checkboxes or the never-edited view are
      // hiding — the CSV's Kind and Edited after creation columns carry
      // those flags, so filtering happens visibly in the spreadsheet, never
      // silently in the file. (The button's tooltip states this.)
      const results = tabStates[criterion].results ?? [];
      const csv = buildOrphanCsv(results, {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
      });
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`orphans-${criterion}-${sdk.ids.space}-${date}.csv`, csv);
    },
    [tabStates, sdk]
  );

  const runArchive = useCallback(async () => {
    setConfirmArchiveOpen(false);
    setArchiving(true);
    try {
      // The archive endpoint differs per kind, so selection ids are resolved
      // back to results to recover whether each is an entry or an asset.
      const targets = (currentTab.results ?? [])
        .filter((result) => currentTab.selectedIds.includes(result.id))
        .map((result) => ({ id: result.id, kind: result.kind }));
      const outcome = await archiveOrphans(
        sdk.cma,
        targets,
        parameters.batchSize,
        setArchiveProgress
      );
      // Archived items leave the result list; failed ones stay visible and
      // selected so the user can retry them.
      patchTab(activeTab, {
        results:
          currentTab.results?.filter((result) => !outcome.archivedIds.includes(result.id)) ?? null,
        selectedIds: outcome.failedIds,
      });
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
  }, [sdk, activeTab, currentTab, parameters, patchTab]);

  // Tab labels carry the cached result count so users can see at a glance
  // which scans have run and what they found without switching tabs. The
  // criterion explanations live inside each panel (always visible above the
  // scan button), so the labels stay clean.
  const tabLabel = (criterion: ScanCriterion) => {
    const { results } = tabStates[criterion];
    return `${CRITERIA[criterion].tabLabel}${results !== null ? ` (${results.length})` : ''}`;
  };

  /**
   * One criterion's whole panel: scan controls plus that tab's cached
   * results. Both panels share the scope checkboxes (per-run setting) and
   * the archive machinery; only the state behind them is per-tab.
   */
  const renderPanel = (criterion: ScanCriterion) => {
    const tab = tabStates[criterion];
    const chrome = CRITERIA[criterion];
    // Computed per criterion (not from the activeTab-level memos): React
    // evaluates both panels' JSX even though only one is mounted. The scope
    // checkboxes filter first, the never-edited view second, so the view
    // pills count within the current scope.
    const scopeVisible = (tab.results ?? []).filter((result) =>
      result.kind === 'entry' ? scanEntries : scanAssets
    );
    const displayed = scopeVisible.filter((result) => !tab.neverEditedOnly || result.neverEdited);
    const displayedCounts = countByKind(displayed);
    const neverEditedCount = scopeVisible.filter((result) => result.neverEdited).length;
    // Client-side paging of the displayed results: everything is already in
    // memory, so this is purely a rendering choice. The page is clamped here
    // instead of written back to state — rows can vanish under the current
    // page without a filter event (archiving the last page's rows), and
    // clamping keeps the view valid without an effect.
    const pageCount = Math.max(1, Math.ceil(displayed.length / RESULTS_PAGE_SIZE));
    const activePage = Math.min(tab.page, pageCount - 1);
    const pagedResults = displayed.slice(
      activePage * RESULTS_PAGE_SIZE,
      (activePage + 1) * RESULTS_PAGE_SIZE
    );
    return (
      <Flex flexDirection="column" gap="spacingL" marginTop="spacingL">
        {/* The criterion's full explanation lives here, inside its tab; the
            page subtitle stays general and the tab-label tooltips carry the
            short form. */}
        {/* Descriptions bring their own <Text> paragraphs (the unreferenced
            one is two, so its caveat stands alone); the Box keeps their
            internal spacing out of this column's larger gap. */}
        <Box>{chrome.description}</Box>
        <Flex alignItems="center" gap="spacingM">
          <Button
            variant="primary"
            startIcon={chrome.icon}
            onClick={() => runScan(criterion)}
            isDisabled={contentTypesLoading || busy || (!scanEntries && !scanAssets)}
            isLoading={activeScan === criterion}
            testId={`scan-${criterion}-button`}>
            {activeScan === criterion ? 'Scanning…' : chrome.scanLabel}
          </Button>
          {/* Dual-purpose scope: decides what the next scan fetches AND
              live-filters already-scanned results (the entry fan-out is the
              slow part of a scan, so an assets-only pass is quick). */}
          <Checkbox
            isChecked={scanEntries}
            onChange={(event) => setScope('entry', event.target.checked)}
            isDisabled={busy}
            testId="scope-entries">
            Entries
          </Checkbox>
          <Checkbox
            isChecked={scanAssets}
            onChange={(event) => setScope('asset', event.target.checked)}
            isDisabled={busy}
            testId="scope-assets">
            Media assets
          </Checkbox>
          {activeScan === criterion && progress && (
            <Flex alignItems="center" gap="spacingXs">
              <Spinner size="small" />
              <Text fontColor="gray600">{progressLabel(progress)}</Text>
            </Flex>
          )}
        </Flex>

        {tab.results === null && activeScan !== criterion && (
          // Fresh tab: without this the area below the controls would be
          // blank until the first scan, which reads as something missing.
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
            {/* "medium" is the largest size the f36-icons v5 IconSize union
                allows; the "large" this previously claimed never existed and
                silently fell back at runtime. */}
            <MagnifyingGlassIcon size="medium" variant="muted" />
            <Text fontWeight="fontWeightDemiBold">No scan has run yet</Text>
            <Text fontColor="gray600">
              Run a scan to check every content type and the media library for orphaned drafts.
            </Text>
          </Flex>
        )}

        {activeScan === criterion && (
          // Placeholder rows keep the results area occupied while the scan
          // runs; the row count is arbitrary, it only suggests a table.
          <Table testId="scan-skeleton">
            <Table.Body>
              <SkeletonRow rowCount={3} columnCount={7} />
            </Table.Body>
          </Table>
        )}

        {tab.truncated && (
          <Note variant="warning">
            The scan stopped after {parameters.maxCandidates} draft items. Archive or clean up some
            of the results and scan again, or raise the limit in the app configuration.
          </Note>
        )}

        {tab.results !== null &&
          (tab.results.length === 0 ? (
            <Note variant="positive" testId="empty-note">
              {chrome.emptyNote}
            </Note>
          ) : (
            <>
              <Flex alignItems="center" justifyContent="space-between">
                <Flex alignItems="center" gap="spacingM">
                  <Text fontWeight="fontWeightDemiBold" testId="result-count">
                    {describeCounts(displayedCounts)} found
                    {tab.selectedIds.length > 0 ? ` — ${tab.selectedIds.length} selected` : ''}
                  </Text>
                  {/* The scan is broad; these two pills switch between the
                      broad view and the stricter never-edited one. Exactly
                      one is always pressed, and both carry their counts, so
                      the current view — and what clicking the other pill
                      does — is never ambiguous. Untitled tab only: edit
                      history is a junk signal for untitled drafts, but says
                      nothing about whether something is referenced. */}
                  {criterion === 'untitled' && (
                    <Flex alignItems="center" gap="spacingXs">
                      <Text fontColor="gray600">Show</Text>
                      <ToggleButton
                        size="small"
                        isActive={!tab.neverEditedOnly}
                        onToggle={() => setNeverEditedFilter(false)}
                        isDisabled={busy}
                        testId="filter-all">
                        All ({scopeVisible.length})
                      </ToggleButton>
                      {/* "Never edited" is a term of art (sys.version === 1),
                        so it gets a tooltip — including the archive gotcha:
                        unarchiving counts as an edit, so restored orphans
                        only show under "All". */}
                      <Tooltip
                        content="Items never saved after creation — the strictest orphan signal, since even a single edit suggests someone worked on the item. Note that archiving and unarchiving counts as editing, so orphans that were archived and restored appear only under “All” — where you may still want to archive them again."
                        placement="top"
                        maxWidth={360}>
                        <ToggleButton
                          size="small"
                          isActive={tab.neverEditedOnly}
                          onToggle={() => setNeverEditedFilter(true)}
                          isDisabled={busy}
                          testId="filter-never-edited">
                          {/* Trailing info icon as the there-is-a-tooltip cue;
                            ToggleButton's icon prop is leading-only, so it
                            rides along in the children. */}
                          <Flex as="span" alignItems="center" gap="spacing2Xs">
                            Never edited ({neverEditedCount})
                            <InfoIcon size="tiny" variant="muted" />
                          </Flex>
                        </ToggleButton>
                      </Tooltip>
                    </Flex>
                  )}
                  {/* No kind-scoped select-all here: the scope checkboxes
                      above already hide (and deselect) a kind, so "select
                      only entries" is uncheck-assets + select-all, and the
                      archive confirmation still itemizes by kind. */}
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
                  {/* Same tooltip-with-visible-InfoIcon convention as the
                      archive button. The export deliberately ignores the
                      view filters (see exportResults), which is exactly the
                      kind of behavior that must be announced, not
                      discovered. */}
                  <Tooltip
                    content={`Downloads all ${tab.results.length} results from this scan as a CSV file — including rows hidden by the filters above, flagged in their own columns — with editor links for offline review.`}
                    placement="top"
                    maxWidth={340}>
                    <Button
                      variant="secondary"
                      startIcon={<DownloadSimpleIcon />}
                      endIcon={<InfoIcon />}
                      isDisabled={busy}
                      onClick={() => exportResults(criterion)}
                      testId="export-csv-button">
                      Export CSV
                    </Button>
                  </Tooltip>
                  {/* Archiving reads as scary-destructive next to a negative
                      button; the tooltip says it is reversible, and the
                      confirmation dialog carries the deep links to where
                      actual deletion lives. */}
                  <Tooltip
                    content="Archiving is not deleting: archived items just leave the content list and media library, and can be unarchived at any time. The confirmation links to where archived items can be permanently deleted."
                    placement="top"
                    maxWidth={340}>
                    <Button
                      variant="negative"
                      startIcon={<TrayArrowDownIcon />}
                      endIcon={<InfoIcon />}
                      isDisabled={tab.selectedIds.length === 0 || busy}
                      isLoading={archiving}
                      onClick={() => setConfirmArchiveOpen(true)}
                      testId="archive-button">
                      Archive selected
                    </Button>
                  </Tooltip>
                </Flex>
              </Flex>
              {displayed.length === 0 ? (
                // Filters are hiding every result: say which one, instead
                // of showing an empty table — the control to widen the view
                // is right above.
                <Note variant="neutral" testId="filtered-empty-note">
                  {scopeVisible.length === 0
                    ? `All ${tab.results.length} ${pluralize(
                        tab.results.length
                      )} are hidden by the Entries / Media assets checkboxes above.`
                    : `All ${scopeVisible.length} ${pluralize(
                        scopeVisible.length
                      )} in scope were edited after creation — switch the view above to “All” to show them.`}
                </Note>
              ) : (
                <>
                  <OrphanTable
                    results={pagedResults}
                    totalResultCount={displayed.length}
                    selectedIds={tab.selectedIds}
                    onToggleResult={toggleResult}
                    onToggleAll={toggleAll}
                    onOpenResult={openResult}
                    isDisabled={busy}
                  />
                  {displayed.length > RESULTS_PAGE_SIZE && (
                    <Pagination
                      activePage={activePage}
                      onPageChange={(page) => patchTab(criterion, { page })}
                      itemsPerPage={RESULTS_PAGE_SIZE}
                      totalItems={displayed.length}
                      pageLength={pagedResults.length}
                      isLastPage={activePage === pageCount - 1}
                      testId="results-pagination"
                    />
                  )}
                </>
              )}
            </>
          ))}
      </Flex>
    );
  };

  return (
    // Full width: page apps get the whole main column, and the results table
    // benefits from every pixel of it.
    <Box padding="spacingXl">
      <Flex flexDirection="column" gap="spacingL">
        <Box>
          <Heading as="h1" marginBottom="none">
            Find orphaned entries
          </Heading>
          <Text as="p" fontColor="gray600">
            Finds orphaned draft entries and media assets, so they can be reviewed and archived from
            one place. Each tab covers a different definition of “orphaned”.
          </Text>
        </Box>

        {/* Each criterion is a tab holding its own cached results, so
            running one scan, checking the other, and switching back never
            re-runs anything. */}
        <Tabs currentTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ScanCriterion)}>
          <Tabs.List>
            <Tabs.Tab panelId="untitled" testId="tab-untitled">
              {tabLabel('untitled')}
            </Tabs.Tab>
            <Tabs.Tab panelId="unreferenced" testId="tab-unreferenced">
              {tabLabel('unreferenced')}
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="untitled">{renderPanel('untitled')}</Tabs.Panel>
          <Tabs.Panel id="unreferenced">{renderPanel('unreferenced')}</Tabs.Panel>
        </Tabs>
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
        <Text as="p" marginBottom="spacingS">
          The selected {describeCounts(selectedCounts)} will be archived and disappear from the
          content list and media library. Archiving is reversible: anything archived can be
          unarchived from its editor at any time.
        </Text>
        <Text as="p">
          To delete archived items permanently, open the{' '}
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
      </ModalConfirm>
    </Box>
  );
};

export default Page;
