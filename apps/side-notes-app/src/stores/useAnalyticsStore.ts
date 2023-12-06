import create from 'zustand';
import { analyticsStore } from './analytics.store';
import type { AnalyticsStoreState } from './analytics.store';

// @ts-expect-error
export const useAnalyticsStore = create<AnalyticsStoreState>(analyticsStore);
