import { makeAssistantTool } from '@assistant-ui/react';
import { useConfigStore } from '../../store/configStore';
import z from 'zod';

interface GenerateCodeArgs {
  instruction?: string;
  modificationType?: 'modify_code' | 'add_blocks' | 'remove_blocks' | 'full_regenerate';
}

interface GenerateCodeResult {
  newCode: string;
  newBlocks?: string[];
  messageId: string;
}

export const GenerateCodeTool = makeAssistantTool({
  toolName: 'generateCode',
  description: `Generate or modify configuration page code based on user instructions.

Use this tool when the user asks to:
- Modify existing code (change labels, add validation, update styles, etc.)
- Add or remove UI blocks
- Regenerate the entire configuration
- Make any changes to the configuration page code

The tool will receive the current selected blocks and generated code, process the request, and return updated code.`,
  parameters: z.object({
    instruction: z
      .string()
      .describe('The user instruction describing what changes to make to the code'),
    modificationType: z
      .enum(['modify_code', 'add_blocks', 'remove_blocks', 'full_regenerate'])
      .describe(
        `Type of modification:
- modify_code: Make changes to existing code without changing blocks
- add_blocks: Add new UI blocks to the selection
- remove_blocks: Remove blocks from the selection
- full_regenerate: Completely regenerate the code`
      )
      .optional(),
  }),
  execute: async ({ instruction, modificationType = 'modify_code' }) => {
    // Get current state from store
    const state = useConfigStore.getState();
    const selectedBlocks = state.selectedBlocks;
    const currentCode = state.getCurrentCode();

    console.log('Executing generateCodeTool with:', {
      instruction,
      modificationType,
      selectedBlocks,
      currentCodeLength: currentCode.length,
    });

    // Call the API endpoint with the data
    const response = await fetch(
      'https://template-config-hack-api-rho.colorfuldemo.com/api/generate-code',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          modificationType,
          selectedBlocks,
          currentCode,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result: GenerateCodeResult = await response.json();

    console.log('generateCodeTool result:', result);

    // Update the store with the suggested code change
    state.setSuggestedChange({
      suggestedCode: result.newCode,
      newBlocks: result.newBlocks,
      messageId: result.messageId,
    });

    // The result will be passed to the CodeGenerationToolUI for rendering
    return result;
  },
});
