import create from 'zustand/vanilla';
import type { InternalSdkState } from '../types';

export const internalSdkStore = create<InternalSdkState>((set) => ({
  internalSdk: undefined,
  setInternalSdk: (internalSdk) => set({ internalSdk }),
}));

export const { getState, setState, subscribe, destroy } = internalSdkStore;
