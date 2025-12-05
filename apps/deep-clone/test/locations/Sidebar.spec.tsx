import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Sidebar from '../../src/locations/Sidebar';
import { render, act, fireEvent } from '@testing-library/react';
import { mockSdk } from '../mocks';

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

vi.mock('../../src/utils/EntryCloner', () => {
  return {
    default: vi
      .fn()
      .mockImplementation(
        (cma, parameters, entryId, setReferencesCount, setClonesCount, setUpdatesCount) => ({
          cloneEntry: vi.fn().mockImplementation(async () => {
            setReferencesCount(2);
            setClonesCount(2);
            setUpdatesCount(1);
            return { sys: { id: 'cloned-id' } };
          }),
          getReferencesQty: vi.fn().mockImplementation(async () => 2),
        })
      ),
  };
});

vi.mock('../../src/utils/useInstallationParameters', () => ({
  useInstallationParameters: vi.fn().mockReturnValue({
    cloneText: 'Copy',
    cloneTextBefore: true,
    automaticRedirect: true,
  }),
}));

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Clone entry')).toBeDefined();
  });

  it('shows message with references count', async () => {
    const { getByText } = render(<Sidebar />);
    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });
    expect(getByText('Found 2 references.')).toBeDefined();
    expect(getByText('Created 2 new entries out of 2.')).toBeDefined();
    expect(getByText('Updated 1 reference.')).toBeDefined();
  });

  it('calls redirect and shows redirect message', async () => {
    const { getByText } = render(<Sidebar />);
    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });
    expect(getByText(/Redirecting to newly created clone in/)).toBeDefined();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(mockSdk.navigator.openEntry).toHaveBeenCalledWith('cloned-id');
  });

  it('use updated parameters', async () => {
    const { useInstallationParameters } = await import('../../src/utils/useInstallationParameters');
    (useInstallationParameters as any).mockReturnValue({
      cloneText: 'Updated',
      cloneTextBefore: false,
      automaticRedirect: false,
    });

    const { getByText } = render(<Sidebar />);
    expect(getByText('Clone entry')).toBeDefined();

    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });

    const EntryCloner = (await import('../../src/utils/EntryCloner')).default;
    expect(EntryCloner).toHaveBeenCalledWith(
      expect.anything(),
      {
        cloneText: 'Updated',
        cloneTextBefore: false,
        automaticRedirect: false,
      },
      'test-entry',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });
});
