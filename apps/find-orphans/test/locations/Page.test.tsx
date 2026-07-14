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

const scan = async () => {
  await waitFor(() => expect(screen.getByTestId('scan-button')).toBeEnabled());
  fireEvent.click(screen.getByTestId('scan-button'));
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
    expect(screen.getByTestId('scan-button')).toBeInTheDocument();
    // The why-does-this-app-exist explanation moved from an always-visible
    // Note into a tooltip behind this info button.
    expect(screen.getByTestId('scan-info')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('scan-button')).toBeEnabled());
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
    expect(screen.getByText('Untitled')).toBeInTheDocument();
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

  it('quick-selects one kind and itemizes the archive confirmation', async () => {
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

    // The kind toggles select every result of that kind, so archiving all
    // entries never sweeps assets along.
    fireEvent.click(screen.getByTestId('select-entries'));
    expect(screen.getByTestId('result-count')).toHaveTextContent('2 selected');
    expect(
      within(screen.getByTestId('orphan-row-asset-a')).getByRole('checkbox')
    ).not.toBeChecked();

    // Toggling the same kind off deselects exactly those again.
    fireEvent.click(screen.getByTestId('select-entries'));
    expect(screen.getByTestId('result-count')).not.toHaveTextContent('selected');
    fireEvent.click(screen.getByTestId('select-entries'));

    // The confirmation names kinds, not generic items.
    fireEvent.click(screen.getByTestId('archive-button'));
    expect(await screen.findByText('Archive 2 entries')).toBeInTheDocument();

    // Select-all on a mixed list itemizes both kinds.
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByTestId('select-all'));
    fireEvent.click(screen.getByTestId('archive-button'));
    expect(await screen.findByText('Archive 2 entries and 1 asset')).toBeInTheDocument();
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

    // With both scopes off there is nothing to scan, so the button disables.
    fireEvent.click(screen.getByTestId('scope-entries'));
    expect(screen.getByTestId('scan-button')).toBeDisabled();
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

    // The archive button only activates once something is selected, and the
    // adjacent popover explains archive-vs-delete with deep links into the
    // web app's archived views.
    expect(screen.getByTestId('archive-button')).toBeDisabled();
    fireEvent.click(screen.getByTestId('archive-info'));
    const archivedLink = await screen.findByTestId('archived-entries-link');
    expect(archivedLink).toHaveAttribute(
      'href',
      'https://app.contentful.com/spaces/space-id/environments/master/views/entries?filters.0.key=__status&filters.0.op=&filters.0.val=archived'
    );
    expect(archivedLink).toHaveAttribute('target', '_blank');
    fireEvent.click(screen.getByTestId('archive-info'));
    fireEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('archive-button')).toBeEnabled();

    fireEvent.click(screen.getByTestId('archive-button'));
    // The confirmation modal must be accepted before anything is archived.
    expect(entryArchive).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByText('Archive 2 entries'));

    await waitFor(() => expect(entryArchive).toHaveBeenCalledTimes(2));
    // Archived entries leave the list, which empties it here.
    await waitFor(() => expect(screen.getByTestId('empty-note')).toBeInTheDocument());
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
