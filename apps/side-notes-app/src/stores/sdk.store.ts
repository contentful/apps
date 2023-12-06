import create from 'zustand/vanilla';
import type { SdkState } from '../types';

export const sdkStore = create<SdkState>((set) => ({
  sdk: undefined,
  setSdk: (sdk) => set({ sdk }),
}));

export const { getState, setState, subscribe, destroy } = sdkStore;
