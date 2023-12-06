import create from 'zustand/vanilla';
import type { AnalyticsClient } from '../analytics';

const generateRandomUUID = (): string => {
  return window.crypto.randomUUID();
};

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
  sequenceKey: generateRandomUUID(),
  refreshSequenceKey: () => set({ sequenceKey: generateRandomUUID() }),
  setInitialized: () => set({ isInitialized: true }),
}));

export const { setState } = analyticsStore;
