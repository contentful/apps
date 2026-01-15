/**
 * TabNavigation Component
 *
 * A reusable tab navigation component for the PostHog sidebar.
 * Provides tabs for Analytics, Recordings, and Feature Flags.
 */

import { Tabs } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import type { SidebarTab } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface TabConfig {
  id: SidebarTab;
  label: string;
  disabled?: boolean;
  badge?: number;
}

export interface TabNavigationProps {
  /** Currently active tab */
  activeTab: SidebarTab;
  /** Callback when tab changes */
  onTabChange: (tab: SidebarTab) => void;
  /** Optional: tabs to show (defaults to all tabs) */
  tabs?: TabConfig[];
  /** Content to render for each tab */
  children: React.ReactNode;
}

// ============================================================================
// Default Tab Configuration
// ============================================================================

export const DEFAULT_TABS: TabConfig[] = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'recordings', label: 'Recordings' },
  { id: 'flags', label: 'Flags' },
];

// ============================================================================
// Styles
// ============================================================================

const styles = {
  tabList: css({
    marginBottom: tokens.spacingM,
    borderBottom: `1px solid ${tokens.gray300}`,
  }),
  tab: css({
    position: 'relative',
  }),
  badge: css({
    position: 'absolute',
    top: '-4px',
    right: '-8px',
    backgroundColor: tokens.blue500,
    color: tokens.colorWhite,
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightMedium,
    borderRadius: '10px',
    padding: '0 6px',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  disabledTab: css({
    opacity: 0.5,
    cursor: 'not-allowed',
  }),
};

// ============================================================================
// Component
// ============================================================================

/**
 * TabNavigation provides a consistent tab interface for the PostHog sidebar.
 *
 * @example
 * ```tsx
 * <TabNavigation
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * >
 *   <TabNavigation.Panel id="analytics">
 *     <AnalyticsDisplay {...props} />
 *   </TabNavigation.Panel>
 *   <TabNavigation.Panel id="recordings">
 *     <RecordingsList {...props} />
 *   </TabNavigation.Panel>
 *   <TabNavigation.Panel id="flags">
 *     <FeatureFlagsList {...props} />
 *   </TabNavigation.Panel>
 * </TabNavigation>
 * ```
 */
export function TabNavigation({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
  children,
}: TabNavigationProps) {
  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !tab.disabled) {
      onTabChange(tabId as SidebarTab);
    }
  };

  return (
    <Tabs currentTab={activeTab} onTabChange={handleTabChange}>
      <Tabs.List className={styles.tabList}>
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.id}
            panelId={tab.id}
            isDisabled={tab.disabled}
            className={tab.disabled ? styles.disabledTab : styles.tab}>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={styles.badge}>{tab.badge > 99 ? '99+' : tab.badge}</span>
            )}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {children}
    </Tabs>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * TabNavigation.Panel - Wrapper for tab panel content
 */
TabNavigation.Panel = Tabs.Panel;

export default TabNavigation;
