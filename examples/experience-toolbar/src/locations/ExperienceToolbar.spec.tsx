import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ExperienceToolbar from './ExperienceToolbar';
import { mockSdk } from '../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ExperienceToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.exo.context = { type: 'experience', entityId: 'experience-123' };
    mockSdk.exo.getUiMode.mockReturnValue('visual');
    mockSdk.exo.experience.selection.get.mockReturnValue({ nodeId: null });
  });

  it('renders the editing context and ui mode', () => {
    const { getByText, getByTestId } = render(<ExperienceToolbar />);

    expect(getByText('visual mode')).toBeInTheDocument();
    expect(getByTestId('entity-id')).toHaveTextContent('Editing experience experience-123');
  });

  it('shows the empty state when nothing is selected', () => {
    const { getByTestId } = render(<ExperienceToolbar />);

    expect(getByTestId('empty-state')).toBeInTheDocument();
  });

  it('subscribes to context, ui mode, and selection changes', () => {
    render(<ExperienceToolbar />);

    expect(mockSdk.exo.onContextChanged).toHaveBeenCalledOnce();
    expect(mockSdk.exo.onUiModeChanged).toHaveBeenCalledOnce();
    expect(mockSdk.exo.experience.selection.onChange).toHaveBeenCalledOnce();
  });

  it('warns when in form mode', () => {
    mockSdk.exo.getUiMode.mockReturnValue('form');

    const { getByText } = render(<ExperienceToolbar />);

    expect(getByText('form mode')).toBeInTheDocument();
    expect(getByText(/Canvas selection and highlighting are disabled/)).toBeInTheDocument();
  });

  it('resolves the selected node and renders its properties', async () => {
    const { getByTestId } = render(<ExperienceToolbar />);

    // Drive a selection change through the subscription callback.
    const onSelectionChange = mockSdk.exo.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    expect(mockSdk.exo.experience.getNode).toHaveBeenCalledWith('node-1');

    await waitFor(() => {
      const table = getByTestId('properties-table');
      expect(table).toHaveTextContent('heading');
      expect(table).toHaveTextContent('backgroundColor');
    });
  });

  it('shows a loading spinner while properties resolve', async () => {
    // A deferred promise lets us assert the spinner before resolving.
    let resolveProps: (props: unknown[]) => void = () => {};
    const pending = new Promise<unknown[]>((resolve) => {
      resolveProps = resolve;
    });
    mockSdk.exo.experience.getNode.mockReturnValue({
      id: 'node-1',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockReturnValue(pending),
    });

    const { container, getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.exo.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    // Spinner is visible while the promise is unresolved.
    await waitFor(() =>
      expect(container.querySelector('[data-test-id="cf-ui-spinner"]')).toBeInTheDocument()
    );

    await act(async () => {
      resolveProps([{ key: 'heading', area: 'content', value: 'Welcome' }]);
    });

    await waitFor(() => expect(getByTestId('properties-table')).toHaveTextContent('heading'));
  });

  it('clears the spinner and renders no table when getProperties rejects', async () => {
    mockSdk.exo.experience.getNode.mockReturnValue({
      id: 'node-1',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockRejectedValueOnce(new Error('node removed')),
    });

    const { container, queryByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.exo.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    // Degrades gracefully: the loading spinner clears and no properties table
    // is rendered — the panel does not get stuck on a spinner.
    await waitFor(() =>
      expect(container.querySelector('[data-test-id="cf-ui-spinner"]')).not.toBeInTheDocument()
    );
    expect(queryByTestId('properties-table')).not.toBeInTheDocument();
  });

  it('renders a bound property as "sourceType → entryId"', async () => {
    mockSdk.exo.experience.getNode.mockReturnValue({
      id: 'node-1',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockResolvedValue([
        {
          key: 'title',
          area: 'content',
          value: null,
          binding: { sourceType: 'entry', entryId: 'entry-42' },
        },
      ]),
    });

    const { getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.exo.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    await waitFor(() => {
      const table = getByTestId('properties-table');
      expect(table).toHaveTextContent('entry → entry-42');
    });
  });

  it('highlights the selected node on the canvas in visual mode', async () => {
    mockSdk.exo.getUiMode.mockReturnValue('visual');

    const { getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.exo.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    const button = await waitFor(() => getByTestId('highlight-button'));
    fireEvent.click(button);

    expect(mockSdk.exo.experience.selection.highlight).toHaveBeenCalledWith('node-1', {
      flash: true,
      scrollIntoView: true,
    });
  });

  it('disables the highlight button in form mode', async () => {
    mockSdk.exo.getUiMode.mockReturnValue('form');

    const { getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.exo.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    const button = await waitFor(() => getByTestId('highlight-button'));
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockSdk.exo.experience.selection.highlight).not.toHaveBeenCalled();
  });
});
