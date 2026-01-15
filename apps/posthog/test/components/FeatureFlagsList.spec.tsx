import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FeatureFlagsList } from '../../src/components/FeatureFlagsList';
import type { FeatureFlag } from '../../src/types';

describe('FeatureFlagsList component', () => {
  const mockFlags: FeatureFlag[] = [
    {
      id: 1,
      key: 'new-feature',
      name: 'New Feature',
      active: true,
      rolloutPercentage: 100,
      createdAt: '2026-01-10T10:00:00Z',
      createdBy: 'user@example.com',
    },
    {
      id: 2,
      key: 'beta-feature',
      name: 'Beta Feature',
      active: false,
      rolloutPercentage: 50,
      createdAt: '2026-01-05T10:00:00Z',
      createdBy: 'admin@example.com',
    },
    {
      id: 3,
      key: 'experimental',
      name: 'Experimental Feature',
      active: true,
      rolloutPercentage: null,
      createdAt: '2026-01-01T10:00:00Z',
      createdBy: 'dev@example.com',
    },
  ];

  const defaultProps = {
    flags: mockFlags,
    isLoading: false,
    error: null,
    onToggle: vi.fn(),
    isToggling: null,
    isReadOnly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('displays loading indicator when isLoading is true', () => {
      render(<FeatureFlagsList {...defaultProps} isLoading={true} flags={[]} />);

      expect(screen.getByTestId('flags-loading')).toBeTruthy();
      expect(screen.getByText('Loading feature flags...')).toBeTruthy();
    });

    it('does not display flags when loading', () => {
      render(<FeatureFlagsList {...defaultProps} isLoading={true} />);

      expect(screen.queryByTestId('flags-list')).toBeNull();
    });
  });

  describe('Error state', () => {
    it('displays error message when error is provided', () => {
      const errorMessage = 'Failed to fetch feature flags';
      render(<FeatureFlagsList {...defaultProps} error={errorMessage} flags={[]} />);

      expect(screen.getByTestId('flags-error')).toBeTruthy();
      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('does not display flags when there is an error', () => {
      render(<FeatureFlagsList {...defaultProps} error="Some error" />);

      expect(screen.queryByTestId('flags-list')).toBeNull();
    });
  });

  describe('Empty state', () => {
    it('displays empty state when flags array is empty', () => {
      render(<FeatureFlagsList {...defaultProps} flags={[]} />);

      expect(screen.getByTestId('flags-empty')).toBeTruthy();
      expect(screen.getByText('No Feature Flags')).toBeTruthy();
    });
  });

  describe('Success state - displaying flags', () => {
    it('displays list of feature flags', () => {
      render(<FeatureFlagsList {...defaultProps} />);

      expect(screen.getByTestId('flags-list')).toBeTruthy();
      expect(screen.getByText('New Feature')).toBeTruthy();
      expect(screen.getByText('Beta Feature')).toBeTruthy();
      expect(screen.getByText('Experimental Feature')).toBeTruthy();
    });

    it('displays flag keys', () => {
      render(<FeatureFlagsList {...defaultProps} />);

      expect(screen.getByText('new-feature')).toBeTruthy();
      expect(screen.getByText('beta-feature')).toBeTruthy();
      expect(screen.getByText('experimental')).toBeTruthy();
    });

    it('displays toggle switches for each flag', () => {
      render(<FeatureFlagsList {...defaultProps} />);

      const toggles = screen.getAllByRole('switch');
      expect(toggles).toHaveLength(3);
    });

    it('shows correct toggle state for active flags', () => {
      render(<FeatureFlagsList {...defaultProps} />);

      const toggles = screen.getAllByRole('switch');
      // First flag is active
      expect(toggles[0]).toHaveAttribute('aria-checked', 'true');
      // Second flag is inactive
      expect(toggles[1]).toHaveAttribute('aria-checked', 'false');
      // Third flag is active
      expect(toggles[2]).toHaveAttribute('aria-checked', 'true');
    });

    it('displays rollout percentage when available', () => {
      render(<FeatureFlagsList {...defaultProps} />);

      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();
    });
  });

  describe('Toggle functionality', () => {
    it('calls onToggle when toggle is clicked', async () => {
      const onToggle = vi.fn();
      render(<FeatureFlagsList {...defaultProps} onToggle={onToggle} />);

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]);

      expect(onToggle).toHaveBeenCalledWith(1, false); // Flag 1 was active, now toggling to false
    });

    it('calls onToggle with correct values for inactive flag', async () => {
      const onToggle = vi.fn();
      render(<FeatureFlagsList {...defaultProps} onToggle={onToggle} />);

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[1]); // Second flag is inactive

      expect(onToggle).toHaveBeenCalledWith(2, true); // Flag 2 was inactive, now toggling to true
    });

    it('disables toggle while flag is being toggled', () => {
      render(<FeatureFlagsList {...defaultProps} isToggling={1} />);

      const toggles = screen.getAllByRole('switch');
      expect(toggles[0]).toBeDisabled();
      expect(toggles[1]).not.toBeDisabled();
      expect(toggles[2]).not.toBeDisabled();
    });

    it('shows loading state for toggle being toggled', () => {
      render(<FeatureFlagsList {...defaultProps} isToggling={2} />);

      // The second toggle should show loading state
      expect(screen.getByTestId('flag-2-loading')).toBeTruthy();
    });
  });

  describe('Read-only mode', () => {
    it('disables all toggles when isReadOnly is true', () => {
      render(<FeatureFlagsList {...defaultProps} isReadOnly={true} />);

      const toggles = screen.getAllByRole('switch');
      toggles.forEach((toggle) => {
        expect(toggle).toBeDisabled();
      });
    });

    it('shows read-only message when isReadOnly is true', () => {
      render(<FeatureFlagsList {...defaultProps} isReadOnly={true} />);

      expect(screen.getByText(/read-only/i)).toBeTruthy();
    });

    it('does not call onToggle when toggle is clicked in read-only mode', () => {
      const onToggle = vi.fn();
      render(<FeatureFlagsList {...defaultProps} onToggle={onToggle} isReadOnly={true} />);

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]);

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('handles flag without name (uses key as fallback)', () => {
      const flagsWithoutName: FeatureFlag[] = [
        {
          id: 1,
          key: 'unnamed-flag',
          name: '',
          active: true,
          rolloutPercentage: null,
          createdAt: '2026-01-10T10:00:00Z',
          createdBy: 'user@example.com',
        },
      ];

      render(<FeatureFlagsList {...defaultProps} flags={flagsWithoutName} />);

      // Should display key when name is empty
      expect(screen.getAllByText('unnamed-flag').length).toBeGreaterThanOrEqual(1);
    });

    it('handles many flags', () => {
      const manyFlags: FeatureFlag[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        key: `flag-${i + 1}`,
        name: `Feature Flag ${i + 1}`,
        active: i % 2 === 0,
        rolloutPercentage: null,
        createdAt: '2026-01-10T10:00:00Z',
        createdBy: 'user@example.com',
      }));

      render(<FeatureFlagsList {...defaultProps} flags={manyFlags} />);

      const toggles = screen.getAllByRole('switch');
      expect(toggles).toHaveLength(20);
    });
  });
});
