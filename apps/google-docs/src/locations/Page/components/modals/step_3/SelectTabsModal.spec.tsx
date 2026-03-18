import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectTabsModal } from './SelectTabsModal';
import { createMockSDK } from '../../../../../../test/mocks';
import type { PageAppSDK } from '@contentful/app-sdk';

const mockSdk = createMockSDK() as PageAppSDK;

const defaultProps = {
  sdk: mockSdk,
  isOpen: true,
  onBack: vi.fn(),
  onContinue: vi.fn(),
  onClose: vi.fn(),
};

const renderModal = (props = {}) => render(<SelectTabsModal {...defaultProps} {...props} />);

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
      renderModal();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
        expect(
          screen.getByText(/The selected document contains multiple document tabs/)
        ).toBeTruthy();
        expect(screen.getByText(/Would you like to select which tabs should be used/)).toBeTruthy();
      });
    });

    it('renders the Back and Next action buttons', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
      });
    });

    it('does not render modal content when isOpen is false', async () => {
      renderModal({ isOpen: false });

      await waitFor(() => {
        expect(screen.queryByText(/Would you like to select which tabs should be used/)).toBeNull();
      });
    });

    it('loads and renders available tab options', async () => {
      renderModal();

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
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(screen.getByText('Please select an option.')).toBeTruthy();
      });
    });

    it('shows a validation error when Next is clicked with "Yes, select specific tabs" but no tabs selected', async () => {
      renderModal();

      selectYesSelectSpecificTabs();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(screen.getByText('You must select at least one tab.')).toBeTruthy();
      });
    });

    it('calls onContinue with all tabs when No import all is selected', async () => {
      renderModal();

      fireEvent.click(screen.getByLabelText('No, import all tabs'));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
        expect(defaultProps.onContinue).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ tabId: 'tab-1', tabTitle: 'Introduction' }),
          ])
        );
      });
    });
  });

  describe('Tab selection', () => {
    it('shows a selected tab as a pill after selecting it', async () => {
      renderModal();

      // One "Close" button exists on the modal header; selecting a tab adds a second for the pill
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1));
      await selectTab('tab-1');
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2));
    });

    it('removes the pill when its close button is clicked', async () => {
      renderModal();
      await selectTab('tab-1');

      const buttons = screen.getAllByRole('button', { name: 'Close' });
      fireEvent.click(buttons[1]);

      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1));
    });

    it('calls onContinue with selected tabs after selecting a tab and clicking Next', async () => {
      renderModal();
      await selectTab('tab-1');

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
        expect(defaultProps.onContinue).toHaveBeenCalledWith([
          expect.objectContaining({ tabId: 'tab-1', tabTitle: 'Introduction' }),
        ]);
      });
    });
  });

  describe('Navigation callbacks', () => {
    it('calls onBack when the Back button is clicked', async () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      await waitFor(() => {
        expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose when the modal header close button is clicked', async () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});
