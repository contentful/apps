import { cleanup, render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { VALIDATION_RANGES } from '../../src/utils/consts';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const simulateSave = async () => {
  const onConfigureCalls = mockSdk.app.onConfigure.mock.calls;
  const onConfigureCallback = onConfigureCalls[onConfigureCalls.length - 1][0];
  return await act(async () => {
    return await onConfigureCallback();
  });
};

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue({});
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'page' }, name: 'Page' },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the config screen with all form fields', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Content Production Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Content "Needs update" time threshold (months)')).toBeInTheDocument();
    expect(screen.getByText('"Recently published" time period (days)')).toBeInTheDocument();
    expect(screen.getByText('Time to publish threshold (days)')).toBeInTheDocument();
    expect(screen.getAllByTestId('cf-ui-text-input').length).toBe(3);
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText(/Content types to track in publication trends/i)).toBeInTheDocument();
  });

  it('validates required fields and shows error messages', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Content Production Dashboard')).toBeInTheDocument();
    });

    await simulateSave();

    await waitFor(() => {
      expect(mockSdk.notifier.error).toHaveBeenCalledWith(
        'Please fill in all required fields with valid values before saving.'
      );
      expect(screen.getByText('Needs update months is required')).toBeInTheDocument();
      expect(screen.getByText('Recently published days is required')).toBeInTheDocument();
      expect(screen.getByText('Time to publish days is required')).toBeInTheDocument();
    });
  });

  it('validates range for needsUpdateMonths field', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Content Production Dashboard')).toBeInTheDocument();
    });

    const needsUpdateInput = screen.getAllByTestId('cf-ui-text-input')[0];

    // Test value below minimum
    await user.clear(needsUpdateInput);
    await user.type(needsUpdateInput, '0');

    await simulateSave();

    await waitFor(() => {
      expect(
        screen.getByText(
          `Needs update months must be between ${VALIDATION_RANGES.needsUpdateMonths.min} and ${VALIDATION_RANGES.needsUpdateMonths.max}`
        )
      ).toBeInTheDocument();
    });

    // Test value above maximum
    await user.clear(needsUpdateInput);
    await user.type(needsUpdateInput, '25');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await simulateSave();

    await waitFor(() => {
      expect(
        screen.getByText(
          `Needs update months must be between ${VALIDATION_RANGES.needsUpdateMonths.min} and ${VALIDATION_RANGES.needsUpdateMonths.max}`
        )
      ).toBeInTheDocument();
    });
  });

  it('validates range for recentlyPublishedDays field', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Content Production Dashboard')).toBeInTheDocument();
    });

    const recentlyPublishedInput = screen.getAllByTestId('cf-ui-text-input')[1];

    // Test value below minimum
    await user.clear(recentlyPublishedInput);
    await user.type(recentlyPublishedInput, '0');

    await simulateSave();

    await waitFor(() => {
      expect(
        screen.getByText(
          `Recently published days must be between ${VALIDATION_RANGES.recentlyPublishedDays.min} and ${VALIDATION_RANGES.recentlyPublishedDays.max}`
        )
      ).toBeInTheDocument();
    });

    // Test value above maximum
    await user.clear(recentlyPublishedInput);
    await user.type(recentlyPublishedInput, '31');

    await simulateSave();

    await waitFor(() => {
      expect(
        screen.getByText(
          `Recently published days must be between ${VALIDATION_RANGES.recentlyPublishedDays.min} and ${VALIDATION_RANGES.recentlyPublishedDays.max}`
        )
      ).toBeInTheDocument();
    });
  });

  it('validates range for timeToPublishDays field', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Content Production Dashboard')).toBeInTheDocument();
    });

    const timeToPublishInput = screen.getAllByTestId('cf-ui-text-input')[2];

    // Test value below minimum
    await user.clear(timeToPublishInput);
    await user.type(timeToPublishInput, '6');
    await simulateSave();

    await waitFor(() => {
      expect(
        screen.getByText(
          `Time to publish days must be between ${VALIDATION_RANGES.timeToPublishDays.min} and ${VALIDATION_RANGES.timeToPublishDays.max}`
        )
      ).toBeInTheDocument();
    });

    // Test value above maximum
    await user.clear(timeToPublishInput);
    await user.type(timeToPublishInput, '91');

    await simulateSave();

    await waitFor(() => {
      expect(
        screen.getByText(
          `Time to publish days must be between ${VALIDATION_RANGES.timeToPublishDays.min} and ${VALIDATION_RANGES.timeToPublishDays.max}`
        )
      ).toBeInTheDocument();
    });
  });

  it('allows valid input values', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Content Production Dashboard')).toBeInTheDocument();
    });

    // Toggle showUpcomingReleases switch
    const switchInput = screen.getByRole('switch');
    await user.click(switchInput);

    // Fill all required fields with minimum values
    const needsUpdateInput = screen.getAllByTestId('cf-ui-text-input')[0];
    const recentlyPublishedInput = screen.getAllByTestId('cf-ui-text-input')[1];
    const timeToPublishInput = screen.getAllByTestId('cf-ui-text-input')[2];

    await user.clear(needsUpdateInput);
    await user.type(needsUpdateInput, VALIDATION_RANGES.needsUpdateMonths.min.toString());

    await user.clear(recentlyPublishedInput);
    await user.type(recentlyPublishedInput, VALIDATION_RANGES.recentlyPublishedDays.min.toString());

    await user.clear(timeToPublishInput);
    await user.type(timeToPublishInput, VALIDATION_RANGES.timeToPublishDays.min.toString());

    // Verify all parameters are persisted correctly
    const result = await simulateSave();

    expect(result).not.toBe(false);
    expect(result).toEqual({
      parameters: {
        needsUpdateMonths: VALIDATION_RANGES.needsUpdateMonths.min,
        recentlyPublishedDays: VALIDATION_RANGES.recentlyPublishedDays.min,
        timeToPublishDays: VALIDATION_RANGES.timeToPublishDays.min,
        showUpcomingReleases: true,
      },
      targetState: {},
    });
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });
});
