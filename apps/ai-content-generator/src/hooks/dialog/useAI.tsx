import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { OpenAI } from 'openai';
import { useRef, useState } from 'react';
import { defaultModelId } from '@configs/ai/gptModels';
import {
  PersistedInstallationParameters,
  ProfileFields,
  ProfileType,
} from '@components/config/appInstallationParameters';

export type GenerateMessage = (prompt: string, targetLocale: string) => Promise<string>;

// Thrown to unwind the generate flow when the user hits "Stop Generating".
// Treated as a cancellation, not a failure, so no error UI is shown.
class GenerationAbortedError extends Error {
  constructor() {
    super('Generation aborted by user');
    this.name = 'GenerationAbortedError';
  }
}

// Resolves never; rejects with a GenerationAbortedError as soon as the signal
// aborts. Used to race against a request that can't itself be cancelled.
const rejectOnAbort = (signal: AbortSignal): Promise<never> => {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new GenerationAbortedError());
      return;
    }
    signal.addEventListener('abort', () => reject(new GenerationAbortedError()), { once: true });
  });
};

const useAI = () => {
  const sdk = useSDK<DialogAppSDK<PersistedInstallationParameters>>();
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  // Lets "Stop Generating" abandon the in-flight App Action. The proxy is a
  // single blocking call with no server-side cancel, so we can't kill the
  // request itself — instead we stop waiting on it and discard the response.
  const abortRef = useRef<AbortController | null>(null);

  const createGPTPayload = (
    content: string,
    profile: ProfileType,
    targetLocale: string
  ): OpenAI.ChatCompletionMessageParam[] => {
    const userPrompt: OpenAI.ChatCompletionMessageParam = { role: 'user', content };
    return [...baseSystemPrompt(profile, targetLocale), userPrompt];
  };

  const resetOutput = () => {
    setOutput('');
    setError(null);
    setHasError(false);
  };

  const generateMessage = async (prompt: string, targetLocale: string): Promise<string> => {
    resetOutput();
    setIsGenerating(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const installation = sdk.parameters.installation;
      const model = installation.model ?? defaultModelId;
      // Installation params are persisted flat; reassemble the ProfileType the
      // prompt builder expects.
      const profile: ProfileType = {
        [ProfileFields.PROFILE]: installation.profile,
        [ProfileFields.VALUES]: installation.values,
        [ProfileFields.TONE]: installation.tone,
        [ProfileFields.EXCLUDE]: installation.exclude,
        [ProfileFields.INCLUDE]: installation.include,
        [ProfileFields.AUDIENCE]: installation.audience,
        [ProfileFields.ADDITIONAL]: installation.additional,
      };
      const messages = createGPTPayload(prompt, profile, targetLocale);

      const actionCall = sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId: sdk.ids.app!,
          appActionId: 'openaiProxyAction',
        },
        {
          parameters: {
            messages: JSON.stringify(messages),
            model,
          },
        }
      );

      // The App Action can't be cancelled server-side, so race it against the
      // abort signal and let the user stop waiting on it.
      const result = await Promise.race([actionCall, rejectOnAbort(abortController.signal)]);

      if (result.sys.status !== 'succeeded') {
        const msg = result.sys.status === 'failed' ? result.sys.error?.message : undefined;
        throw new Error(msg ?? 'App action call failed');
      }

      const body = result.sys.result as { text: string };
      setOutput(body.text);
      return body.text;
    } catch (err: unknown) {
      // A user-initiated stop is a cancellation, not an error — leave the UI
      // clean and drop back to the input view.
      if (err instanceof GenerationAbortedError) {
        return '';
      }
      console.error(err);
      setError(err);
      setHasError(true);
      return '';
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  const sendStopSignal = () => {
    abortRef.current?.abort();
  };

  return {
    generateMessage,
    isGenerating,
    output,
    setOutput,
    resetOutput,
    sendStopSignal,
    error,
    hasError,
  };
};

export default useAI;
