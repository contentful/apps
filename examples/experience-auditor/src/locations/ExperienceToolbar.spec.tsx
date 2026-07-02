import React from 'react';
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExperienceToolbar from './ExperienceToolbar';
import { mockSdk, defaultNodes, makeMockNode } from '../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ExperienceToolbar (Experience Auditor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.experiences.getUiMode.mockReturnValue('visual');
    mockSdk.access.can.mockResolvedValue(true);
    mockSdk.experiences.experience.selection = {
      get: vi.fn().mockReturnValue({ nodeId: null }),
      onChange: vi.fn().mockReturnValue(vi.fn()),
      set: vi.fn(),
      highlight: vi.fn(),
    };
    mockSdk.experiences.experience.getRootNodes.mockReturnValue(defaultNodes);
    mockSdk.experiences.experience.getNode.mockImplementation(
      (id: string) => defaultNodes.find((n) => n.id === id) ?? null
    );
  });

  it('runs an audit on mount and renders findings with a score', async () => {
    const { getByTestId, getAllByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getByTestId('health-score')).toBeInTheDocument());
    // The default fixture has one error (missing alt) + one warning (empty heading).
    expect(getAllByTestId('finding').length).toBeGreaterThanOrEqual(2);
  });

  it('blocks publish while errors remain', async () => {
    const { getByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getByTestId('publish-blocked')).toBeInTheDocument());
    expect(mockSdk.experiences.experience.publish).not.toHaveBeenCalled();
  });

  it('locates a finding via selection + highlight', async () => {
    const user = userEvent.setup();
    const { getAllByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));

    const firstFinding = getAllByTestId('finding')[0];
    await user.click(within(firstFinding).getByText('Locate'));

    expect(mockSdk.experiences.experience.selection.set).toHaveBeenCalledOnce();
    expect(mockSdk.experiences.experience.selection.highlight).toHaveBeenCalledWith(
      expect.any(String),
      {
        flash: true,
        scrollIntoView: true,
      }
    );
  });

  it('disables locate in form mode', async () => {
    mockSdk.experiences.getUiMode.mockReturnValue('form');
    const { getAllByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));

    const locateButton = within(getAllByTestId('finding')[0]).getByText('Locate').closest('button');
    expect(locateButton).toBeDisabled();
  });

  it('surfaces a deterministic fix as read-only advice (no write path on 4.59)', async () => {
    // A node whose alt text has stray whitespace yields a finding with a
    // "Trim whitespace" fix. The 4.59 surface has no setContentProperty, so the
    // fix is advisory: the trimmed value is shown, not applied.
    const fixNode = makeMockNode('hero', 'Component', [
      { key: 'image', area: 'content', value: { sys: { id: 'asset-1' } } },
      { key: 'altText', area: 'content', value: '  spaced alt  ' },
    ]);
    mockSdk.experiences.experience.getRootNodes.mockReturnValue([fixNode]);
    mockSdk.experiences.experience.getNode.mockReturnValue(fixNode);

    const { getAllByTestId, getByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));

    // The advice shows the trimmed value; there is no Apply/Fix button to click.
    const advice = getByTestId('deterministic-advice');
    expect(advice).toHaveTextContent('Trim whitespace');
    expect(advice).toHaveTextContent('spaced alt');
    expect(mockSdk.notifier.success).not.toHaveBeenCalled();
  });

  it('surfaces a suggested fix as a read-only value (no editable apply)', async () => {
    const metaNode = makeMockNode('page', 'Component', [
      { key: 'heading', area: 'content', value: 'Spring Sale' },
      { key: 'metaTitle', area: 'content', value: '' },
    ]);
    mockSdk.experiences.experience.getRootNodes.mockReturnValue([metaNode]);
    mockSdk.experiences.experience.getNode.mockReturnValue(metaNode);

    const { getByTestId, queryByText } = render(<ExperienceToolbar />);
    await waitFor(() => expect(getByTestId('suggested-fix')).toBeInTheDocument());

    // The derived suggestion is shown read-only; no editable input, no Apply.
    expect(getByTestId('suggested-value')).toHaveTextContent('Spring Sale');
    expect(queryByText('Apply')).toBeNull();
    expect(mockSdk.notifier.success).not.toHaveBeenCalled();
  });

  it('renders Locate as disabled when selection is unsupported', async () => {
    mockSdk.experiences.experience.selection = undefined;
    const { getAllByTestId } = render(<ExperienceToolbar />);
    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));
    const locate = within(getAllByTestId('finding')[0]).getByText('Locate').closest('button');
    expect(locate).toBeDisabled();
    expect(locate).toHaveAttribute('title', expect.stringContaining('not available'));
  });
});
