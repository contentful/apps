import { Spinner, TextLink, Note } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import type { SessionRecording } from '../types';
import { styles } from '../locations/Sidebar.styles';

export interface RecordingsListProps {
  /** List of session recordings */
  recordings: SessionRecording[];
  /** Whether recordings are currently loading */
  isLoading: boolean;
  /** Error message, or null if no error */
  error: string | null;
  /** Base URL for PostHog dashboard (for generating recording links) */
  posthogHost?: string;
  /** Project ID for generating recording links */
  projectId?: string;
}

/**
 * Formats duration in seconds to human-readable format.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "3m 5s" or "45s"
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago", "Yesterday").
 * @param timestamp - ISO timestamp string
 * @returns Human-readable relative time
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Generates the PostHog recording URL.
 */
function getRecordingUrl(
  recording: SessionRecording,
  posthogHost?: string,
  projectId?: string
): string {
  // Use pre-computed URL if available
  if (recording.viewUrl) {
    return recording.viewUrl;
  }
  if (recording.recordingUrl) {
    return recording.recordingUrl;
  }

  // Generate URL from host and project ID
  if (posthogHost && projectId) {
    const baseUrl =
      posthogHost === 'us'
        ? 'https://us.posthog.com'
        : posthogHost === 'eu'
        ? 'https://eu.posthog.com'
        : posthogHost;
    return `${baseUrl}/project/${projectId}/replay/${recording.id}`;
  }

  return '#';
}

/**
 * Displays a list of session recordings with links to view them in PostHog.
 * Handles loading, error, and empty states.
 */
export function RecordingsList({
  recordings,
  isLoading,
  error,
  posthogHost,
  projectId,
}: RecordingsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer} data-testid="recordings-loading">
        <Spinner size="large" />
        <p className={styles.loadingText}>Loading recordings...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer} data-testid="recordings-error">
        <Note variant="negative">{error}</Note>
      </div>
    );
  }

  // Empty state
  if (recordings.length === 0) {
    return (
      <div className={styles.emptyState} data-testid="recordings-empty">
        <p className={styles.emptyStateTitle}>No Recordings Found</p>
        <p className={styles.emptyStateText}>
          No session recordings have been captured for this page yet. Make sure session recording is
          enabled in your PostHog project.
        </p>
      </div>
    );
  }

  // Success state - display recordings list
  return (
    <div
      className={styles.listContainer}
      data-testid="recordings-list"
      role="list"
      aria-label={`${recordings.length} session recordings`}>
      {recordings.map((recording, index) => {
        const recordingUrl = getRecordingUrl(recording, posthogHost, projectId);
        const sessionLabel = `Session ${recording.id.slice(0, 8)}`;
        const timeLabel = formatRelativeTime(recording.startTime);
        const durationLabel = formatDuration(recording.duration);

        return (
          <div key={recording.id} className={styles.listItem} role="listitem">
            <TextLink
              href={recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLinkIcon />}
              alignIcon="end"
              aria-label={`View ${sessionLabel} recording from ${timeLabel}, duration ${durationLabel}. Opens in new tab.`}>
              <div>
                <div className={styles.listItemTitle}>{sessionLabel}...</div>
                <div className={styles.listItemMeta}>
                  {timeLabel} · {durationLabel}
                </div>
              </div>
            </TextLink>
          </div>
        );
      })}
    </div>
  );
}

export default RecordingsList;
