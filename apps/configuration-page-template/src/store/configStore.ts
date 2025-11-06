import { create } from 'zustand';
import { generateCombinedCode } from '../components/config/codeGenerator';

export interface SuggestedCodeChange {
  suggestedCode: string;
  newBlocks?: string[];
  messageId: string;
}

interface ConfigState {
  // Selected UI blocks
  selectedBlocks: string[];
  setSelectedBlocks: (blocks: string[]) => void;

  // Custom code override (when user accepts modified code)
  customCode: string | null;
  setCustomCode: (code: string | null) => void;

  // Suggested code changes from AI
  suggestedChange: SuggestedCodeChange | null;
  setSuggestedChange: (change: SuggestedCodeChange | null) => void;

  // Accept suggested change
  acceptSuggestedChange: () => void;

  // Reject suggested change
  rejectSuggestedChange: () => void;

  // Get current code (custom override or generated from blocks)
  getCurrentCode: () => string;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  selectedBlocks: [],
  setSelectedBlocks: (blocks) => {
    // When blocks change, clear custom code
    set({ selectedBlocks: blocks, customCode: null });
  },

  customCode: null,
  setCustomCode: (code) => set({ customCode: code }),

  suggestedChange: null,
  setSuggestedChange: (change) => set({ suggestedChange: change }),

  acceptSuggestedChange: () => {
    const { suggestedChange } = get();
    if (suggestedChange) {
      // If there are new blocks, update the selection (clears custom code)
      if (suggestedChange.newBlocks) {
        set({
          selectedBlocks: suggestedChange.newBlocks,
          customCode: null,
          suggestedChange: null,
        });
      } else {
        // Accept the code modification - save as custom code
        set({
          customCode: suggestedChange.suggestedCode,
          suggestedChange: null,
        });
      }
    }
  },

  rejectSuggestedChange: () => {
    set({ suggestedChange: null });
  },

  getCurrentCode: () => {
    const { customCode, selectedBlocks } = get();
    // Return custom code if it exists, otherwise generate from blocks
    if (customCode) {
      return customCode;
    }
    return selectedBlocks.length > 0 ? generateCombinedCode(selectedBlocks) : '';
  },
}));
