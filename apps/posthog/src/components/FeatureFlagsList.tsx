import { Spinner, Note, Switch, Badge, Text } from '@contentful/f36-components';
import type { FeatureFlag } from '../types';
import { styles } from '../locations/Sidebar.styles';

export interface FeatureFlagsListProps {
  /** List of feature flags */
  flags: FeatureFlag[];
  /** Whether flags are currently loading */
  isLoading: boolean;
  /** Error message, or null if no error */
  error: string | null;
  /** Callback when a flag is toggled */
  onToggle: (flagId: number, active: boolean) => void;
  /** ID of the flag currently being toggled, or null */
  isToggling: number | null;
  /** Whether the user has permission to toggle flags */
  isReadOnly: boolean;
}

/**
 * Displays a list of feature flags with toggle switches.
 * Handles loading, error, empty, and read-only states.
 */
export function FeatureFlagsList({
  flags,
  isLoading,
  error,
  onToggle,
  isToggling,
  isReadOnly,
}: FeatureFlagsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer} data-testid="flags-loading">
        <Spinner size="large" />
        <p className={styles.loadingText}>Loading feature flags...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer} data-testid="flags-error">
        <Note variant="negative">{error}</Note>
      </div>
    );
  }

  // Empty state
  if (flags.length === 0) {
    return (
      <div className={styles.emptyState} data-testid="flags-empty">
        <p className={styles.emptyStateTitle}>No Feature Flags</p>
        <p className={styles.emptyStateText}>
          No feature flags have been created in your PostHog project yet.
        </p>
      </div>
    );
  }

  // Handle toggle click
  const handleToggle = (flag: FeatureFlag) => {
    if (isReadOnly || isToggling !== null) return;
    onToggle(flag.id, !flag.active);
  };

  // Success state - display flags list
  return (
    <div data-testid="flags-list">
      {/* Read-only notice */}
      {isReadOnly && (
        <Note variant="neutral" className={styles.listContainer}>
          <Text>You have read-only access. Flag toggles are disabled.</Text>
        </Note>
      )}

      <div className={styles.listContainer}>
        {flags.map((flag) => {
          const isFlagToggling = isToggling === flag.id;
          const displayName = flag.name || flag.key;

          return (
            <div key={flag.id} className={styles.flagRow}>
              <div className={styles.flagInfo}>
                <div className={styles.flagName}>{displayName}</div>
                <div className={styles.flagKey}>{flag.key}</div>
                {flag.rolloutPercentage !== null && (
                  <Badge variant="secondary" size="small" style={{ marginTop: '4px' }}>
                    {flag.rolloutPercentage}%
                  </Badge>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isFlagToggling && <Spinner size="small" data-testid={`flag-${flag.id}-loading`} />}
                <Switch
                  id={`flag-toggle-${flag.id}`}
                  isChecked={flag.active}
                  isDisabled={isReadOnly || isFlagToggling}
                  onChange={() => handleToggle(flag)}
                  aria-label={`Toggle ${displayName}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FeatureFlagsList;
