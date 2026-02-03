import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { RescheduleModal } from '../../src/components/RescheduleModal';
import type { ReleaseWithScheduledAction } from '../../src/utils/fetchReleases';
import { HomeAppSDK } from '@contentful/app-sdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const createMockRelease = (
  overrides?: Partial<ReleaseWithScheduledAction>
): ReleaseWithScheduledAction => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    id: 'release-1',
    scheduledActionId: 'action-1',
    title: 'Test Release',
    scheduledFor: {
      datetime: futureDate.toISOString(),
      timezone: 'America/New_York',
    },
    action: 'publish',
    itemsCount: 5,
    updatedAt: now.toISOString(),
    updatedBy: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
    viewUrl: 'https://app.contentful.com/spaces/test/releases/release-1',
    ...overrides,
  };
};

const createMockScheduledAction = () => ({
  sys: {
    id: 'action-1',
    version: 1,
  },
  action: 'publish',
  entity: { sys: { id: 'release-1', linkType: 'Release', type: 'Link' } },
  environment: { sys: { id: 'master', linkType: 'Environment', type: 'Link' } },
  scheduledFor: {
    datetime: new Date().toISOString(),
    timezone: 'UTC',
  },
});

describe('RescheduleModal component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const testId = 'reschedule-modal';

  const renderModal = (release: ReleaseWithScheduledAction) => {
    return render(
      <RescheduleModal
        isShown={true}
        onClose={mockOnClose}
        release={release}
        sdk={mockSdk as HomeAppSDK}
        onSuccess={mockOnSuccess}
        testId={testId}
      />
    );
  };

  const waitForFormReady = async () => {
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Select time')).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCma.scheduledActions = {
      get: vi.fn(),
      update: vi.fn(),
    };
  });

  describe('Rendering', () => {
    it('renders modal with all form fields and labels', async () => {
      const mockRelease = createMockRelease();
      renderModal(mockRelease);

      await waitForFormReady();

      expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
      expect(screen.getByText('Publish on')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Time zone')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Select timezone')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('shows validation errors when submitting with empty fields', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease();
      const mockScheduledAction = createMockScheduledAction();

      mockCma.scheduledActions.get = vi.fn().mockResolvedValue(mockScheduledAction);
      renderModal(mockRelease);

      await waitForFormReady();

      const timeInput = screen.getByPlaceholderText('Select time');
      await user.clear(timeInput);

      const timezoneInput = screen.getByPlaceholderText('Select timezone');
      await user.clear(timezoneInput);

      const submitButton = screen.getByRole('button', { name: /set schedule/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Time is required')).toBeInTheDocument();
        expect(screen.getByText('Timezone is required')).toBeInTheDocument();
      });

      expect(mockCma.scheduledActions.update).not.toHaveBeenCalled();
    });
  });

  describe('Submission', () => {
    it('successfully submits form with valid data and disables button during submission', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease();
      const mockScheduledAction = createMockScheduledAction();

      let resolveUpdate: ((value: any) => void) | undefined;
      const updatePromise = new Promise<any>((resolve) => {
        resolveUpdate = resolve;
      });

      mockCma.scheduledActions.get = vi.fn().mockResolvedValue(mockScheduledAction);
      mockCma.scheduledActions.update = vi.fn().mockImplementation(() => updatePromise);
      renderModal(mockRelease);

      await waitForFormReady();

      const submitButton = screen.getByRole('button', { name: /set schedule/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(mockCma.scheduledActions.get).toHaveBeenCalledWith({
          scheduledActionId: 'action-1',
          spaceId: 'test-space',
          environmentId: 'test-environment',
        });
      });

      await act(async () => {
        resolveUpdate!(mockScheduledAction);
        await updatePromise;
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(mockCma.scheduledActions.update).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling', () => {
    it('displays error notification when update fails', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease();
      const mockScheduledAction = createMockScheduledAction();

      mockCma.scheduledActions.get = vi.fn().mockResolvedValue(mockScheduledAction);
      mockCma.scheduledActions.update = vi.fn().mockRejectedValue(new Error('Update failed'));
      renderModal(mockRelease);

      await waitForFormReady();

      const submitButton = screen.getByRole('button', { name: /set schedule/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSdk.notifier.error).toHaveBeenCalledWith('Failed to reschedule release');
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Modal closing', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease();
      renderModal(mockRelease);

      await waitForFormReady();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });
});
