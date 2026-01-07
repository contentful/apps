import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { act, cleanup, render, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import React from 'react';
import userEvent from '@testing-library/user-event';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../../src/components/ContentTypeMultiSelect', () => ({
  default: () => {
    return <div>Content type selector mock</div>;
  },
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)?.[0]?.();
}

describe('Config Screen component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('Component text exists', async () => {
    render(<ConfigScreen />);
    expect(await screen.findByRole('heading', { name: /Set up Deep Clone/i })).toBeTruthy();
    expect(await screen.findByText(/Assign content types/i)).toBeTruthy();
    expect(await screen.findByText(/Naming/i)).toBeTruthy();
    expect(await screen.findByText(/Getting started/i)).toBeTruthy();
  });

  it('saves with default parameters', async () => {
    render(<ConfigScreen />);
    expect(await screen.findByLabelText(/Clone text/i)).toBeTruthy();

    await act(async () => {
      const result = await saveAppInstallation();
      expect(result).toEqual({
        parameters: { cloneText: 'Copy', cloneTextBefore: true, automaticRedirect: true },
        targetState: { EditorInterface: {} },
      });
    });
  });

  it('saves after changing parameters', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);
    expect(await screen.findByLabelText(/Clone text/i)).toBeTruthy();

    const input = screen.getByLabelText(/Clone text/i);
    await user.clear(input);
    await user.type(input, 'Clone');

    const cloneTextBefore = screen.getByTestId('cloneTextAfter');
    await user.click(cloneTextBefore);

    const automaticRedirect = screen.getByLabelText(/Automatic redirect/i);
    await user.click(automaticRedirect);

    await act(async () => {
      const result = await saveAppInstallation();
      expect(result).toEqual({
        parameters: { cloneText: 'Clone', cloneTextBefore: false, automaticRedirect: false },
        targetState: { EditorInterface: {} },
      });
    });
  });

  it('shows a toast error if the clone text is not set', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);
    expect(await screen.findByLabelText(/Clone text/i)).toBeTruthy();

    const input = screen.getByLabelText(/Clone text/i);
    user.clear(input);
    await act(async () => {
      await saveAppInstallation();
    });

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'The app configuration was not saved. Please try again.'
    );
  });
});
