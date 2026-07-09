import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Page from '../../src/locations/Page';
import { createMockCma, createMockSdk, makeMockEntry, mockArticleContentType } from '../mocks';

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
    await waitFor(() => expect(screen.getByTestId('scan-button')).toBeEnabled());
  });

  it('scans, lists orphaned entries, and opens one on demand', async () => {
    const orphan = makeMockEntry('orphan-1', 'article');
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType],
      entriesByContentType: { article: [orphan] },
    });
    const sdk = createMockSdk(cma);
    mocks.sdk = sdk;

    render(<Page />);
    await scan();

    await waitFor(() => expect(screen.getByTestId('orphan-table')).toBeInTheDocument());
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 entry found');
    expect(screen.getByText('Untitled')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();

    // Previewing is a dedicated action so row clicks never trigger the slide-in.
    fireEvent.click(screen.getByText('Preview'));
    expect(sdk.navigator.openEntry).toHaveBeenCalledWith('orphan-1', { slideIn: true });
  });

  it('shows an empty state when nothing matches', async () => {
    const { cma } = createMockCma({ contentTypes: [mockArticleContentType] });
    mocks.sdk = createMockSdk(cma);

    render(<Page />);
    await scan();

    await waitFor(() => expect(screen.getByTestId('empty-note')).toBeInTheDocument());
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
