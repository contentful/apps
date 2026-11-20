import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Page from '../../src/locations/Page';
import {
  createMockCma,
  createMockSdk,
  makeMockAsset,
  makeMockEntry,
  makeMockUser,
  mockArticleContentType,
} from '../mocks';

const mocks = vi.hoisted(() => ({
  sdk: undefined as unknown,
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mocks.sdk,
}));

const scan = async (button = 'scan-untitled-button') => {
  await waitFor(() => expect(screen.getByTestId(button)).toBeEnabled());
  fireEvent.click(screen.getByTestId(button));
};

// Radix-based f36 Tabs activate on mousedown, not click.
const switchTab = (tabTestId: string) => {
  fireEvent.mouseDown(screen.getByTestId(tabTestId));
  fireEvent.click(screen.getByTestId(tabTestId));
};

describe('Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading and the scan button', async () => {
    const { cma } = createMockCma({ contentTypes: [mockArticleContentType] });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);

    expect(screen.getByText('Find orphaned entries')).toBeInTheDocument();
    // Each criterion is a tab; the active tab's panel holds its scan button
    // with the criterion's description visible above it.
    expect(screen.getByTestId('tab-untitled')).toBeInTheDocument();
    expect(screen.getByTestId('tab-unreferenced')).toBeInTheDocument();
    expect(screen.getByTestId('scan-untitled-button')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('scan-untitled-button')).toBeEnabled());
  });

  it('scans, lists orphaned entries, and opens one on demand', async () => {
    const orphan = makeMockEntry('orphan-1', 'article');
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [orphan] },
      users: [makeMockUser('user-1', 'Jane', 'Doe')],
    });
    const sdk = createMockSdk(cma);
    mocks.sdk = sdk;

    render(<Page />);
    await scan();

    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry found');
    // Scoped to the table: "Untitled" also appears as a criterion radio label.
    expect(within(screen.getByTestId('orphan-table')).getByText('Untitled')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();
    // The creator column resolves sys.createdBy to the user's name.
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();

    // Previewing is a dedicated action so row clicks never trigger the slide-in.
    fireEvent.click(screen.getByText('Preview'));
    expect(sdk.navigator.openEntry).toHaveBeenCalledWith('orphan-1', { slideIn: true });
  });

  it('lists orphaned assets alongside entries and previews them in the asset editor', async () => {
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [makeMockEntry('orphan-entry', 'article')] },
      assets: [makeMockAsset('orphan-asset')],
    });
    const sdk = createMockSdk(cma);
    mocks.sdk = sdk;

    render(<Page />);
    await scan();

    await waitFor(() =>
      expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry and 1 asset found')
    );
    expect(screen.getByText('Asset')).toBeInTheDocument();

    // The asset row's preview must open the asset editor, not the entry editor.
    fireEvent.click(within(screen.getByTestId('orphan-row-orphan-asset')).getByText('Preview'));
    expect(sdk.navigator.openAsset).toHaveBeenCalledWith('orphan-asset', { slideIn: true });
    expect(sdk.navigator.openEntry).not.toHaveBeenCalled();
  });

  it('archives one kind via scope filtering and itemizes the confirmation', async () => {
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: {
        article: [makeMockEntry('entry-a', 'article'), makeMockEntry('entry-b', 'article')],
      },
      assets: [makeMockAsset('asset-a')],
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

    // "Archive only entries" = hide assets via the scope checkbox, then
    // select-all: the hidden asset can never be swept along.
    fireEvent.click(screen.getByTestId('scope-assets'));
    fireEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('result-count')).toHaveTextContent('2 selected');

    // The confirmation names kinds, not generic items.
    fireEvent.click(screen.getByTestId('archive-button'));
    expect(await screen.findByText('Archive 2 entries')).toBeInTheDocument();

    // Select-all on a mixed list itemizes both kinds.
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByTestId('scope-assets'));
    fireEvent.click(screen.getByTestId('select-all'));
    fireEvent.click(screen.getByTestId('archive-button'));
    expect(await screen.findByText('Archive 2 entries and 1 asset')).toBeInTheDocument();
  });

  it('finds unreferenced drafts with their real titles when that criterion is selected', async () => {
    // Titled, so invisible to the untitled scan — but nothing links to it.
    const deadPage = makeMockEntry('dead-page', 'article', {
      title: { 'en-US': 'Old landing page' },
    });
    const linked = makeMockEntry('linked', 'article', { title: { 'en-US': 'Linked page' } });
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [deadPage, linked] },
      referenceCounts: { linked: 2 },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    switchTab('tab-unreferenced');
    await scan('scan-unreferenced-button');

    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry found');
    // Unreferenced results show their real titles, not the Untitled placeholder.
    expect(screen.getByText('Old landing page')).toBeInTheDocument();
    expect(screen.queryByTestId('orphan-row-linked')).not.toBeInTheDocument();
    // Edit history says nothing about referenced-ness, so this tab has no
    // never-edited view switch.
    expect(screen.queryByTestId('filter-never-edited')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-all')).not.toBeInTheDocument();
  });

  it('filters results to never-edited items with a visible toggle', async () => {
    const untouched = makeMockEntry('untouched', 'article');
    const edited = makeMockEntry('edited', 'article', {}, '2026-06-01T00:00:00Z', 4);
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [untouched, edited] },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

    // The untitled tab starts on the never-edited view — the edited draft
    // is hidden, but visibly: both pills carry counts.
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry found');
    expect(screen.getByTestId('filter-all')).toHaveTextContent('All (2)');
    expect(screen.getByTestId('filter-never-edited')).toHaveTextContent('Never edited (1)');
    expect(screen.queryByTestId('orphan-row-edited')).not.toBeInTheDocument();

    // Switching to "All" broadens instantly — no re-scan.
    fireEvent.click(screen.getByTestId('filter-all'));
    expect(screen.getByTestId('result-count')).toHaveTextContent('2 entries found');
    expect(screen.getByTestId('orphan-row-edited')).toBeInTheDocument();

    // Re-narrowing drops selections of rows it hides, so "Archive selected"
    // can never archive something invisible.
    fireEvent.click(within(screen.getByTestId('orphan-row-edited')).getByRole('checkbox'));
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 selected');
    fireEvent.click(screen.getByTestId('filter-never-edited'));
    expect(screen.getByTestId('result-count')).not.toHaveTextContent('selected');
  });

  it('explains when the never-edited filter hides every result', async () => {
    const edited = makeMockEntry('edited', 'article', {}, '2026-06-01T00:00:00Z', 4);
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [edited] },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();

    // Everything found was edited, so with the never-edited view active the
    // table gives way to an explanatory note — the view pills stay above it.
    await waitFor(() => expect(screen.getByTestId('filtered-empty-note')).toBeInTheDocument());
    expect(screen.queryByTestId('orphan-table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-all'));
    expect(screen.getByTestId('orphan-table')).toBeInTheDocument();
    expect(screen.queryByTestId('filtered-empty-note')).not.toBeInTheDocument();
  });

  it('scope checkboxes filter cached results client-side after a scan', async () => {
    const { cma, entryGetMany } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [makeMockEntry('orphan-entry', 'article')] },
      assets: [makeMockAsset('orphan-asset')],
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() =>
      expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry and 1 asset found')
    );
    fireEvent.click(screen.getByTestId('select-all'));
    const scanQueries = entryGetMany.mock.calls.length;

    // Unchecking a scope hides that kind from the cached results instantly —
    // no re-scan — and deselects the hidden rows.
    fireEvent.click(screen.getByTestId('scope-assets'));
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry found — 1 selected');
    expect(screen.queryByTestId('orphan-row-orphan-asset')).not.toBeInTheDocument();
    expect(entryGetMany.mock.calls.length).toBe(scanQueries);

    // Rechecking brings the rows back (still deselected).
    fireEvent.click(screen.getByTestId('scope-assets'));
    expect(screen.getByTestId('orphan-row-orphan-asset')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('orphan-row-orphan-asset')).getByRole('checkbox')
    ).not.toBeChecked();
  });

  it('scans only the checked scopes', async () => {
    const { cma, assetGetMany } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [makeMockEntry('orphan-entry', 'article')] },
      assets: [makeMockAsset('orphan-asset')],
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    // Uncheck assets: the scan must skip the media library entirely.
    fireEvent.click(screen.getByTestId('scope-assets'));
    await scan();

    await waitFor(() =>
      expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry found')
    );
    expect(assetGetMany).not.toHaveBeenCalled();

    // With both scopes off there is nothing to scan, so the scan buttons
    // disable — the scope setting is shared, so this holds on both tabs.
    fireEvent.click(screen.getByTestId('scope-entries'));
    expect(screen.getByTestId('scan-untitled-button')).toBeDisabled();
    switchTab('tab-unreferenced');
    expect(screen.getByTestId('scan-unreferenced-button')).toBeDisabled();
  });

  it('keeps each tab’s results when switching between tabs without re-scanning', async () => {
    const { cma, entryGetMany } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [makeMockEntry('orphan-1', 'article')] },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());
    const scanQueries = entryGetMany.mock.calls.length;

    // The unreferenced tab has not scanned: it shows its own placeholder.
    switchTab('tab-unreferenced');
    expect(screen.getByTestId('pre-scan-placeholder')).toBeInTheDocument();

    // Switching back shows the cached untitled results without any new scan.
    switchTab('tab-untitled');
    expect(screen.getByTestId('orphan-table')).toBeInTheDocument();
    expect(entryGetMany.mock.calls.length).toBe(scanQueries);
    // The tab label carries the cached count.
    expect(screen.getByTestId('tab-untitled')).toHaveTextContent('Untitled drafts (1)');
  });

  it('shows an empty state when nothing matches', async () => {
    const { cma } = createMockCma({ contentTypes: [mockArticleContentType] });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();

    await waitFor(() => expect(screen.getByTestId('empty-note')).toBeInTheDocument());
  });

  it('shows a placeholder before the first scan and removes it afterwards', async () => {
    const { cma } = createMockCma({ contentTypes: [mockArticleContentType] });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    // The results area is never blank: a placeholder fills it on fresh open.
    expect(screen.getByTestId('pre-scan-placeholder')).toBeInTheDocument();

    await scan();
    await waitFor(() => expect(screen.getByTestId('empty-note')).toBeInTheDocument());
    expect(screen.queryByTestId('pre-scan-placeholder')).not.toBeInTheDocument();
  });

  it('selects all entries and archives them after confirmation', async () => {
    const orphanA = makeMockEntry('orphan-a', 'article');
    const orphanB = makeMockEntry('orphan-b', 'article');
    const { cma, entryArchive } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [orphanA, orphanB] },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

    // The archive button only activates once something is selected.
    expect(screen.getByTestId('archive-button')).toBeDisabled();
    fireEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('archive-button')).toBeEnabled();

    fireEvent.click(screen.getByTestId('archive-button'));
    // The confirmation modal must be accepted before anything is archived,
    // and it carries the deep links to the web app's archived views where
    // permanent deletion lives.
    expect(entryArchive).not.toHaveBeenCalled();
    const archivedLink = await screen.findByTestId('archived-entries-link');
    expect(archivedLink).toHaveAttribute(
      'href',
      'https://app.contentful.com/spaces/space-id/environments/master/views/entries?filters.0.key=__status&filters.0.op=&filters.0.val=archived'
    );
    expect(archivedLink).toHaveAttribute('target', '_blank');
    fireEvent.click(await screen.findByText('Archive 2 entries'));

    await waitFor(() => expect(entryArchive).toHaveBeenCalledTimes(2));
    // Archived entries leave the list, which empties it here.
    await waitFor(() => expect(screen.getByTestId('empty-note')).toBeInTheDocument());
  });

  it('paginates results past 50 rows while select-all spans every page', async () => {
    const entries = Array.from({ length: 120 }, (_, i) => makeMockEntry(`orphan-${i}`, 'article'));
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: entries },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

    // Only the first page renders, but the counts describe the whole set.
    expect(screen.getAllByTestId(/^orphan-row-/)).toHaveLength(50);
    expect(screen.getByTestId('result-count')).toHaveTextContent('120 entries found');
    expect(screen.getByTestId('results-pagination')).toBeInTheDocument();

    // Select-all spans every page, not just the rendered one — "archive all
    // 120" must be one click, with the count line spelling out the sweep.
    fireEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('result-count')).toHaveTextContent('120 selected');

    // Pagination is navigation, not a view-narrowing filter: rows on the
    // next page arrive already selected, nothing was deselected by paging.
    fireEvent.click(screen.getByText('Next'));
    const secondPageRows = screen.getAllByTestId(/^orphan-row-/);
    expect(secondPageRows).toHaveLength(50);
    expect(within(secondPageRows[0]).getByRole('checkbox')).toBeChecked();

    // Real view changes reset to the first page: deep pages of the previous
    // view are meaningless coordinates in the reshaped list.
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getAllByTestId(/^orphan-row-/)).toHaveLength(20);
    fireEvent.click(screen.getByTestId('filter-all'));
    expect(screen.getByTestId('orphan-row-orphan-0')).toBeInTheDocument();
  });

  it('exports every cached result to CSV, including rows hidden by the view filters', async () => {
    const untouched = makeMockEntry('untouched', 'article');
    const edited = makeMockEntry('edited', 'article', {}, '2026-06-01T00:00:00Z', 4);
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [untouched, edited] },
    });
    mocks.sdk = createMockSdk(cma);

    // jsdom implements neither object URLs nor real downloads; capture the
    // blob handed to the download anchor and read the CSV back out of it.
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    try {
      render(<Page />);
      await scan();
      await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

      // The default never-edited view hides the edited row from the table...
      expect(screen.queryByTestId('orphan-row-edited')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('export-csv-button'));

      const blob = createObjectURL.mock.calls[0][0];
      // jsdom's Blob has no .text(); FileReader is the API it does implement.
      const csv = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
      const lines = csv.split('\r\n');
      // ...but the export is broad like the scan: both rows are in the
      // file, distinguished by the "Edited after creation" column (positive
      // phrasing, so never-edited items read "no"), with editor links.
      const untouchedLine = lines.find((line) => line.includes('/entries/untouched'));
      const editedLine = lines.find((line) => line.includes('/entries/edited'));
      expect(untouchedLine).toContain(',no,');
      expect(editedLine).toContain(',yes,');
      expect(untouchedLine).toContain(
        'https://app.contentful.com/spaces/space-id/environments/master/entries/untouched'
      );
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });

  it('clamps the page when archiving empties the last page', async () => {
    const entries = Array.from({ length: 60 }, (_, i) => makeMockEntry(`orphan-${i}`, 'article'));
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: entries },
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

    // Select exactly the last page's 10 rows and archive them away.
    fireEvent.click(screen.getByText('Next'));
    const lastPageRows = screen.getAllByTestId(/^orphan-row-/);
    expect(lastPageRows).toHaveLength(10);
    for (const row of lastPageRows) {
      fireEvent.click(within(row).getByRole('checkbox'));
    }
    fireEvent.click(screen.getByTestId('archive-button'));
    fireEvent.click(await screen.findByText('Archive 10 entries'));

    // The page the user was on no longer exists: the view clamps to the
    // remaining single page instead of rendering an empty table, and the
    // pagination control disappears at exactly one page.
    await waitFor(() => expect(screen.getAllByTestId(/^orphan-row-/)).toHaveLength(50));
    expect(screen.queryByTestId('results-pagination')).not.toBeInTheDocument();
  });

  it('keeps entries that failed to archive listed and selected', async () => {
    const orphanA = makeMockEntry('orphan-a', 'article');
    const orphanB = makeMockEntry('orphan-b', 'article');
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [orphanA, orphanB] },
      failArchiveIds: ['orphan-b'],
    });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();
    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('select-all'));
    fireEvent.click(screen.getByTestId('archive-button'));
    fireEvent.click(await screen.findByText('Archive 2 entries'));

    await waitFor(() =>
      expect(screen.queryByTestId('orphan-row-orphan-a')).not.toBeInTheDocument()
    );
    expect(screen.getByTestId('orphan-row-orphan-b')).toBeInTheDocument();
    // The f36 testId sits on the checkbox wrapper, so assert on the input.
    expect(within(screen.getByTestId('orphan-row-orphan-b')).getByRole('checkbox')).toBeChecked();
  });
});
