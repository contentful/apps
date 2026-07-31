import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { OpenAI } from 'openai';
import { useState } from 'react';
import { defaultModelId } from '@configs/ai/gptModels';
import {
  PersistedInstallationParameters,
  ProfileFields,
  ProfileType,
} from '@components/config/appInstallationParameters';

export type GenerateMessage = (prompt: string, targetLocale: string) => Promise<string>;

const useAI = () => {
  const sdk = useSDK<DialogAppSDK<PersistedInstallationParameters>>();
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [hasError, setHasError] = useState<boolean>(false);

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

      const response = await sdk.cma.appActionCall.createWithResponse(
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

      const body: { text: string } = JSON.parse(response.response.body);
      setOutput(body.text);
      return body.text;
    } catch (err: unknown) {
      console.error(err);
      setError(err);
      setHasError(true);
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  const sendStopSignal = () => {
    // No-op: App Actions are not streaming; generation cannot be cancelled mid-flight.
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
