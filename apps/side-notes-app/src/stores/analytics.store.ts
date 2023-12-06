import create from 'zustand/vanilla';
import type { AnalyticsClient } from '../analytics';

export type AnalyticsStoreState = {
  isInitialized: boolean;
  setInitialized: () => void;
  analyticsClient?: AnalyticsClient;
  refreshSequenceKey: () => void;
  sequenceKey: string;
};

export const analyticsStore = create<AnalyticsStoreState>((set) => ({
  isInitialized: false,
  analyticsClient: undefined,
  sequenceKey: window.crypto.randomUUID(),
  refreshSequenceKey: () => set({ sequenceKey: window.crypto.randomUUID() }),
  setInitialized: () => set({ isInitialized: true }),
}));

export const { setState } = analyticsStore;
