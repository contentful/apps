import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
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
});
