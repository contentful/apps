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
    mockSdk.experiences.context = { type: 'experience', entityId: 'experience-123' };
    mockSdk.experiences.experience.selection.get.mockReturnValue({ nodeId: null });
  });

  it('renders the editing context', () => {
    const { getByTestId } = render(<ExperienceToolbar />);

    expect(getByTestId('entity-id')).toHaveTextContent('Editing experience experience-123');
  });

  it('shows the empty state when nothing is selected', () => {
    const { getByTestId } = render(<ExperienceToolbar />);

    expect(getByTestId('empty-state')).toBeInTheDocument();
  });

  it('starts the auto resizer so the host sizes the toolbar panel', () => {
    render(<ExperienceToolbar />);

    expect(mockSdk.window.startAutoResizer).toHaveBeenCalledOnce();
  });

  it('subscribes to context and selection changes', () => {
    render(<ExperienceToolbar />);

    expect(mockSdk.experiences.onContextChanged).toHaveBeenCalledOnce();
    expect(mockSdk.experiences.experience.selection.onChange).toHaveBeenCalledOnce();
  });

  it('resolves the selected node and renders its properties', async () => {
    const { getByTestId } = render(<ExperienceToolbar />);

    // Drive a selection change through the subscription callback.
    const onSelectionChange = mockSdk.experiences.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    expect(mockSdk.experiences.experience.getNode).toHaveBeenCalledWith('node-1');

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
    mockSdk.experiences.experience.getNode.mockReturnValue({
      id: 'node-1',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockReturnValue(pending),
    });

    const { container, getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.experiences.experience.selection.onChange.mock.calls[0][0];
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
    mockSdk.experiences.experience.getNode.mockReturnValue({
      id: 'node-1',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockRejectedValueOnce(new Error('node removed')),
    });

    const { container, queryByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.experiences.experience.selection.onChange.mock.calls[0][0];
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

  it('renders a bound property as "type → entryId"', async () => {
    mockSdk.experiences.experience.getNode.mockReturnValue({
      id: 'node-1',
      nodeType: 'Component',
      onChange: vi.fn().mockReturnValue(vi.fn()),
      getProperties: vi.fn().mockResolvedValue([
        {
          key: 'title',
          area: 'content',
          value: null,
          binding: { type: 'entry', entryId: 'entry-42', fieldId: 'title' },
        },
      ]),
    });

    const { getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.experiences.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    await waitFor(() => {
      const table = getByTestId('properties-table');
      expect(table).toHaveTextContent('entry → entry-42');
    });
  });

  it('highlights the selected node on the canvas', async () => {
    const { getByTestId } = render(<ExperienceToolbar />);
    const onSelectionChange = mockSdk.experiences.experience.selection.onChange.mock.calls[0][0];
    act(() => {
      onSelectionChange({ nodeId: 'node-1', nodeType: 'Component' });
    });

    const button = await waitFor(() => getByTestId('highlight-button'));
    fireEvent.click(button);

    expect(mockSdk.experiences.experience.selection.highlight).toHaveBeenCalledWith('node-1', {
      flash: true,
      scrollIntoView: true,
    });
  });
});
