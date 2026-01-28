import { cleanup, render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import {
  NEEDS_UPDATE_MONTHS_RANGE,
  RECENTLY_PUBLISHED_DAYS_RANGE,
  TIME_TO_PUBLISH_DAYS_RANGE,
} from '../../src/utils/consts';

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
    expect(screen.getByText('Select content types')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Select the default content types to display in the “New entries” and “By content type” charts. You can select up to five./i
      )
    ).toBeInTheDocument();
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
          `Needs update months must be between ${NEEDS_UPDATE_MONTHS_RANGE.min} and ${NEEDS_UPDATE_MONTHS_RANGE.max}`
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
          `Needs update months must be between ${NEEDS_UPDATE_MONTHS_RANGE.min} and ${NEEDS_UPDATE_MONTHS_RANGE.max}`
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
          `Recently published days must be between ${RECENTLY_PUBLISHED_DAYS_RANGE.min} and ${RECENTLY_PUBLISHED_DAYS_RANGE.max}`
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
          `Recently published days must be between ${RECENTLY_PUBLISHED_DAYS_RANGE.min} and ${RECENTLY_PUBLISHED_DAYS_RANGE.max}`
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
          `Time to publish days must be between ${TIME_TO_PUBLISH_DAYS_RANGE.min} and ${TIME_TO_PUBLISH_DAYS_RANGE.max}`
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
          `Time to publish days must be between ${TIME_TO_PUBLISH_DAYS_RANGE.min} and ${TIME_TO_PUBLISH_DAYS_RANGE.max}`
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
    await user.type(needsUpdateInput, NEEDS_UPDATE_MONTHS_RANGE.min.toString());

    await user.clear(recentlyPublishedInput);
    await user.type(recentlyPublishedInput, RECENTLY_PUBLISHED_DAYS_RANGE.min.toString());

    await user.clear(timeToPublishInput);
    await user.type(timeToPublishInput, TIME_TO_PUBLISH_DAYS_RANGE.min.toString());

    // Verify all parameters are persisted correctly
    const result = await simulateSave();

    expect(result).not.toBe(false);
    expect(result).toEqual({
      parameters: {
        needsUpdateMonths: NEEDS_UPDATE_MONTHS_RANGE.min,
        recentlyPublishedDays: RECENTLY_PUBLISHED_DAYS_RANGE.min,
        timeToPublishDays: TIME_TO_PUBLISH_DAYS_RANGE.min,
        showUpcomingReleases: true,
        defaultContentTypes: [],
      },
      targetState: {},
    });
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });
});
