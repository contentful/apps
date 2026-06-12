import React from 'react';
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExperienceToolbar from './ExperienceToolbar';
import { mockSdk, defaultNodes } from '../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ExperienceToolbar (Experience Auditor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.exo.getUiMode.mockReturnValue('visual');
    mockSdk.access.can.mockResolvedValue(true);
    mockSdk.exo.experience.selection = {
      get: vi.fn().mockReturnValue({ nodeId: null }),
      onChange: vi.fn().mockReturnValue(vi.fn()),
      set: vi.fn(),
      highlight: vi.fn(),
    };
    mockSdk.exo.experience.getRootNodes.mockReturnValue(defaultNodes);
    mockSdk.exo.experience.getNode.mockImplementation(
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
    expect(mockSdk.exo.experience.publish).not.toHaveBeenCalled();
  });

  it('locates a finding via selection + highlight', async () => {
    const user = userEvent.setup();
    const { getAllByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));

    const firstFinding = getAllByTestId('finding')[0];
    await user.click(within(firstFinding).getByText('Locate'));

    expect(mockSdk.exo.experience.selection.set).toHaveBeenCalledOnce();
    expect(mockSdk.exo.experience.selection.highlight).toHaveBeenCalledWith(expect.any(String), {
      flash: true,
      scrollIntoView: true,
    });
  });

  it('disables locate in form mode', async () => {
    mockSdk.exo.getUiMode.mockReturnValue('form');
    const { getAllByTestId } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));

    const locateButton = within(getAllByTestId('finding')[0]).getByText('Locate').closest('button');
    expect(locateButton).toBeDisabled();
  });

  it('applies a one-click fix via setContentProperty and re-audits', async () => {
    const user = userEvent.setup();
    // A node whose alt text has stray whitespace yields a finding with a
    // "Trim whitespace" fix. setContentProperty trims it and clears the finding.
    const setContentProperty = vi.fn().mockResolvedValue(undefined);
    let altValue = '  spaced alt  ';
    const fixNode = {
      id: 'hero',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockImplementation(() =>
        Promise.resolve([
          { key: 'image', area: 'content', value: { sys: { id: 'asset-1' } } },
          { key: 'altText', area: 'content', value: altValue },
        ])
      ),
      setContentProperty: vi.fn().mockImplementation(async (key: string, value: string) => {
        if (key === 'altText') altValue = value;
        return setContentProperty(key, value);
      }),
    };
    mockSdk.exo.experience.getRootNodes.mockReturnValue([fixNode]);
    mockSdk.exo.experience.getNode.mockReturnValue(fixNode);

    const { getAllByTestId, queryByText } = render(<ExperienceToolbar />);

    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));
    const fixButton = within(getAllByTestId('finding')[0]).getByText('Trim whitespace');
    await user.click(fixButton);

    expect(setContentProperty).toHaveBeenCalledWith('altText', 'spaced alt');
    await waitFor(() => expect(mockSdk.notifier.success).toHaveBeenCalledWith('Fix applied.'));
    // Re-audit ran on the trimmed value: the whitespace finding is gone.
    await waitFor(() => expect(queryByText('Trim whitespace')).toBeNull());
  });

  it('applies a suggested fix with the edited value via setContentProperty', async () => {
    const user = userEvent.setup();
    const setContentProperty = vi.fn().mockResolvedValue(undefined);
    const metaNode = {
      id: 'page',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      resolveEntryBinding: vi.fn().mockResolvedValue({ entryId: 'e' }),
      getProperties: vi.fn().mockResolvedValue([
        { key: 'heading', area: 'content', value: 'Spring Sale' },
        { key: 'metaTitle', area: 'content', value: '' },
      ]),
      setContentProperty,
    };
    mockSdk.exo.experience.getRootNodes.mockReturnValue([metaNode]);
    mockSdk.exo.experience.getNode.mockReturnValue(metaNode);

    const { getByTestId } = render(<ExperienceToolbar />);
    await waitFor(() => expect(getByTestId('suggested-fix')).toBeInTheDocument());

    const input = within(getByTestId('suggested-fix')).getByLabelText(
      'Suggested value'
    ) as HTMLInputElement;
    expect(input.value).toBe('Spring Sale');
    await user.clear(input);
    await user.type(input, 'Spring Sale 2026');
    await user.click(within(getByTestId('suggested-fix')).getByText('Apply'));

    expect(setContentProperty).toHaveBeenCalledWith('metaTitle', 'Spring Sale 2026');
    await waitFor(() => expect(mockSdk.notifier.success).toHaveBeenCalledWith('Fix applied.'));
  });

  it('renders Locate as disabled when selection is unsupported', async () => {
    mockSdk.exo.experience.selection = undefined;
    const { getAllByTestId } = render(<ExperienceToolbar />);
    await waitFor(() => expect(getAllByTestId('finding').length).toBeGreaterThan(0));
    const locate = within(getAllByTestId('finding')[0]).getByText('Locate').closest('button');
    expect(locate).toBeDisabled();
    expect(locate).toHaveAttribute('title', expect.stringContaining('not available'));
  });
});
