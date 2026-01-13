import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  // Main container
  container: css({
    padding: tokens.spacingM,
    minHeight: '200px',
  }),

  // Header section with title and date selector
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingM,
  }),

  headerTitle: css({
    margin: 0,
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray900,
  }),

  // Tab navigation
  tabList: css({
    marginBottom: tokens.spacingM,
    borderBottom: `1px solid ${tokens.gray300}`,
  }),

  // Metrics display grid
  metricsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),

  // Individual metric card
  metricCard: css({
    padding: tokens.spacingM,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
  }),

  metricValue: css({
    fontSize: tokens.fontSizeXl,
    fontWeight: tokens.fontWeightDemiBold,
    color: tokens.gray900,
    marginBottom: tokens.spacing2Xs,
  }),

  metricLabel: css({
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
    margin: 0,
  }),

  // Full-width metric (for session duration)
  metricCardFull: css({
    gridColumn: '1 / -1',
    padding: tokens.spacingM,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
  }),

  // Loading state
  loadingContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingXl,
    minHeight: '200px',
  }),

  loadingText: css({
    marginTop: tokens.spacingM,
    color: tokens.gray600,
    fontSize: tokens.fontSizeM,
  }),

  // Error state
  errorContainer: css({
    padding: tokens.spacingM,
    backgroundColor: tokens.red100,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingM,
  }),

  errorText: css({
    color: tokens.red600,
    fontSize: tokens.fontSizeM,
    margin: 0,
  }),

  // Empty state
  emptyState: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingXl,
    textAlign: 'center',
    color: tokens.gray600,
  }),

  emptyStateIcon: css({
    marginBottom: tokens.spacingM,
    color: tokens.gray400,
  }),

  emptyStateTitle: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.gray700,
    marginBottom: tokens.spacingXs,
  }),

  emptyStateText: css({
    fontSize: tokens.fontSizeM,
    color: tokens.gray600,
    margin: 0,
  }),

  // Date range selector area
  dateRangeContainer: css({
    marginBottom: tokens.spacingM,
  }),

  // List styles for recordings and feature flags
  listContainer: css({
    marginTop: tokens.spacingM,
  }),

  listItem: css({
    padding: tokens.spacingS,
    borderBottom: `1px solid ${tokens.gray200}`,
    cursor: 'pointer',
    transition: `background-color ${tokens.transitionDurationShort}`,
    '&:hover': {
      backgroundColor: tokens.gray100,
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  }),

  listItemTitle: css({
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.gray900,
    marginBottom: tokens.spacing2Xs,
  }),

  listItemMeta: css({
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
  }),

  // Feature flag toggle row
  flagRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingS,
    borderBottom: `1px solid ${tokens.gray200}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  }),

  flagInfo: css({
    flex: 1,
  }),

  flagName: css({
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.gray900,
    marginBottom: tokens.spacing2Xs,
  }),

  flagKey: css({
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
    fontFamily: tokens.fontStackMonospace,
  }),

  // Section divider
  sectionDivider: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),

  // Refresh indicator
  refreshIndicator: css({
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingXs,
    fontSize: tokens.fontSizeS,
    color: tokens.gray500,
    marginTop: tokens.spacingS,
  }),

  // Link styles
  link: css({
    color: tokens.blue600,
    textDecoration: 'none',
    fontSize: tokens.fontSizeS,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),

  // Not configured state
  notConfiguredContainer: css({
    padding: tokens.spacingL,
    textAlign: 'center',
  }),

  notConfiguredText: css({
    fontSize: tokens.fontSizeM,
    color: tokens.gray700,
    marginBottom: tokens.spacingM,
  }),
};
