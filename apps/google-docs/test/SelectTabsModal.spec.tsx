import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectTabsModal } from '../src/locations/Page/components/modals/step_3/SelectTabsModal';
import type { DocumentTabProps } from '../src/utils/types';

const onContinue = vi.fn();
const onClose = vi.fn();

const ModalWithState = (props: Record<string, unknown> = {}) => {
  const [availableTabs, setAvailableTabs] = useState<DocumentTabProps[]>([]);
  const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);
  return (
    <SelectTabsModal
      isOpen={true}
      onContinue={onContinue}
      onClose={onClose}
      availableTabs={availableTabs}
      setAvailableTabs={setAvailableTabs}
      selectedTabs={selectedTabs}
      setSelectedTabs={setSelectedTabs}
      {...props}
    />
  );
};

const selectYesSelectSpecificTabs = () => {
  fireEvent.click(screen.getByLabelText('Yes, select specific tabs'));
};

const selectTab = async (tabId: string) => {
  selectYesSelectSpecificTabs();

  await waitFor(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Multiselect' }));
  });

  const item = document.querySelector(`[data-test-id="cf-multiselect-list-item-${tabId}"]`);
  const el = item?.closest('label')?.querySelector('input') as HTMLInputElement | null;

  if (el) {
    fireEvent.click(el);
  }
};

describe('SelectTabsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('does not render modal content when isOpen is false', async () => {
      render(<ModalWithState isOpen={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/Would you like to select which tabs should be used/)).toBeNull();
      });
    });

    it('loads and renders available tab options', async () => {
      render(<ModalWithState />);

      selectYesSelectSpecificTabs();

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Multiselect' }));

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
        expect(screen.getByText('Please select an option.')).toBeTruthy();
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
