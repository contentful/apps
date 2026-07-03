import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Sidebar from '../../src/locations/Sidebar';
import { render, act, fireEvent } from '@testing-library/react';
import { mockSdk } from '../mocks';

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  mockGetFailedUpdateIds.mockReturnValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

const mockCloneEntry = vi.fn();
const mockGetFailedUpdateIds = vi.fn().mockReturnValue([]);

vi.mock('../../src/utils/EntryCloner', () => {
  return {
    default: vi
      .fn()
      .mockImplementation(
        (cma, parameters, entryId, setReferencesCount, setClonesCount, setUpdatesCount) => ({
          getReferenceTree: vi.fn().mockImplementation(async () => ({
            entryId: 'test-entry',
            label: 'Main Entry',
            children: [{ entryId: 'referenced-entry-id', label: 'Referenced Entry', children: [] }],
          })),
          cloneEntry: mockCloneEntry.mockImplementation(async () => {
            setReferencesCount(2);
            setClonesCount(2);
            setUpdatesCount(1);
            return { sys: { id: 'cloned-id' } };
          }),
          getFailedUpdateIds: mockGetFailedUpdateIds,
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

  it('shows error Note and fires error notifier when cloneEntry throws', async () => {
    mockCloneEntry.mockRejectedValueOnce(new Error('Failed to clone 1 entry.'));

    const { getByText } = render(<Sidebar />);
    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });

    expect(getByText('Failed to clone 1 entry.')).toBeDefined();
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'Clone failed. Some entries could not be created.'
    );
    expect(mockSdk.notifier.success).not.toHaveBeenCalled();
  });

  it('shows warning Note when some reference updates fail after a successful clone', async () => {
    mockGetFailedUpdateIds.mockReturnValue(['entry-1', 'entry-2']);

    const { getByText } = render(<Sidebar />);
    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });

    expect(
      getByText(
        'Clone created, but 2 internal links could not be repointed. Some references may still point to the original entries.'
      )
    ).toBeDefined();
    expect(mockSdk.notifier.success).toHaveBeenCalledWith('Clone successful');
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });

  it('opens selection dialog before cloning and passes selected entry ids', async () => {
    const { getByText } = render(<Sidebar />);

    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: 'Select entries to clone',
      width: 'large',
      shouldCloseOnEscapePress: true,
      shouldCloseOnOverlayClick: false,
      parameters: {
        referenceTree: {
          entryId: 'test-entry',
          label: 'Main Entry',
          children: [{ entryId: 'referenced-entry-id', label: 'Referenced Entry', children: [] }],
        },
      },
    });

    const EntryCloner = (await import('../../src/utils/EntryCloner')).default;
    expect(EntryCloner).toHaveBeenCalledTimes(1);
    expect((EntryCloner as any).mock.results[0].value.cloneEntry).toHaveBeenCalledWith([
      'test-entry',
      'referenced-entry-id',
    ]);
  });
});
