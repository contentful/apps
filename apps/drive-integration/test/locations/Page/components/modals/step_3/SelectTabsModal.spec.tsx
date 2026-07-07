import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '@contentful/f36-components';
import { SelectTabsModal } from '../../../../../../src/locations/Page/components/modals/step_3/SelectTabsModal';
import type { DocumentTabProps } from '@types';

const onContinue = vi.fn();
const onClose = vi.fn();

const MOCK_TABS: DocumentTabProps[] = [
  { tabId: 'tab-1', tabTitle: 'Introduction' },
  { tabId: 'tab-2', tabTitle: 'Chapter 1' },
  { tabId: 'tab-3', tabTitle: 'Chapter 2' },
  { tabId: 'tab-4', tabTitle: 'Appendix' },
  { tabId: 'tab-5', tabTitle: 'References' },
  { tabId: 'tab-6', tabTitle: 'Chapter 3' },
  { tabId: 'tab-7', tabTitle: 'Chapter 4' },
  { tabId: 'tab-8', tabTitle: 'Long long label 1' },
  { tabId: 'tab-9', tabTitle: 'Chapter 6' },
  { tabId: 'tab-10', tabTitle: 'Chapter 7' },
  { tabId: 'tab-11', tabTitle: 'Chapter 8' },
  { tabId: 'tab-12', tabTitle: 'Chapter 9' },
  { tabId: 'tab-13', tabTitle: 'Long long label 2' },
];

const ModalWithState = (props: { isShown?: boolean } = {}) => {
  const { isShown = true } = props;
  const [availableTabs] = useState<DocumentTabProps[]>(MOCK_TABS);
  const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);
  const [useAllTabs, setUseAllTabs] = useState<boolean | null>(null);
  return (
    <Modal isShown={isShown} onClose={() => {}} size="large">
      {() => (
        <SelectTabsModal
          onContinue={onContinue}
          onClose={onClose}
          availableTabs={availableTabs}
          selectedTabs={selectedTabs}
          setSelectedTabs={setSelectedTabs}
          useAllTabs={useAllTabs}
          setUseAllTabs={setUseAllTabs}
        />
      )}
    </Modal>
  );
};

const selectYesSelectSpecificTabs = () => {
  fireEvent.click(screen.getByLabelText('Yes, select specific tabs'));
};

const selectTab = async (tabId: string) => {
  selectYesSelectSpecificTabs();

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /toggle multiselect/i })).toBeTruthy();
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /toggle multiselect/i }));
  });

  await waitFor(() => {
    expect(
      document.querySelector(`[data-test-id="cf-multiselect-list-item-${tabId}"]`)
    ).toBeTruthy();
  });

  const item = document.querySelector(`[data-test-id="cf-multiselect-list-item-${tabId}"]`);
  const el = item?.closest('label')?.querySelector('input') as HTMLInputElement | null;

  if (el) {
    await act(async () => {
      fireEvent.click(el);
    });
  }
};

describe('SelectTabsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders the modal title and description when open', async () => {
      render(<ModalWithState />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
        expect(
          screen.getByText(/The selected document contains multiple document tabs/)
        ).toBeTruthy();
        expect(screen.getByText(/Would you like to select which tabs should be used/)).toBeTruthy();
      });
    });

    it('renders the Cancel and Next action buttons', async () => {
      render(<ModalWithState />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
      });
    });

    it('does not render modal content when isShown is false', async () => {
      render(<ModalWithState isShown={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Would you like to select which tabs should be used/)).toBeNull();
      });
    });

    it('loads and renders available tab options', async () => {
      render(<ModalWithState />);

      selectYesSelectSpecificTabs();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle multiselect/i })).toBeTruthy();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /toggle multiselect/i }));
      });

      await waitFor(() => {
        expect(
          document.querySelector('[data-test-id="cf-multiselect-list-item-tab-1"]')
        ).toBeTruthy();
        expect(
          document.querySelector('[data-test-id="cf-multiselect-list-item-tab-2"]')
        ).toBeTruthy();
      });
    });

    it('shows a validation error when Next is clicked without selecting a radio', async () => {
      render(<ModalWithState />);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(screen.getByText('You must select an option.')).toBeTruthy();
      });
    });

    it('shows a validation error when Next is clicked with "Yes, select specific tabs" but no tabs selected', async () => {
      render(<ModalWithState />);

      selectYesSelectSpecificTabs();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(screen.getByText('You must select at least one tab.')).toBeTruthy();
      });
    });

    it('calls onContinue with all tabs when No import all is selected', async () => {
      render(<ModalWithState />);

      fireEvent.click(screen.getByLabelText('No, import all tabs'));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(onContinue).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ tabId: 'tab-1', tabTitle: 'Introduction' }),
          ])
        );
      });
    });
  });

  describe('Tab selection', () => {
    it('shows a selected tab as a pill after selecting it', async () => {
      render(<ModalWithState />);

      // One "Close" button exists on the modal header; selecting a tab adds a second for the pill
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1));
      await selectTab('tab-1');
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2));
    });

    it('removes the pill when its close button is clicked', async () => {
      render(<ModalWithState />);
      await selectTab('tab-1');

      const buttons = screen.getAllByRole('button', { name: 'Close' });
      fireEvent.click(buttons[1]);

      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1));
    });

    it('calls onContinue with selected tabs after selecting a tab and clicking Next', async () => {
      render(<ModalWithState />);
      await selectTab('tab-1');

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(onContinue).toHaveBeenCalledWith([
          expect.objectContaining({ tabId: 'tab-1', tabTitle: 'Introduction' }),
        ]);
      });
    });
  });

  describe('Navigation callbacks', () => {
    it('calls onClose when the Cancel button is clicked', async () => {
      render(<ModalWithState />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose when the modal header close button is clicked', async () => {
      render(<ModalWithState />);

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});
