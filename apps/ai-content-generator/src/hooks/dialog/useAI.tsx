import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { OpenAI } from 'openai';
import { useState } from 'react';
import { defaultModelId } from '@configs/ai/gptModels';
import AppInstallationParameters, { ProfileType } from '@components/config/appInstallationParameters';

export type GenerateMessage = (prompt: string, targetLocale: string) => Promise<string>;

type InstallationParametersWithKey = AppInstallationParameters & { key?: string };

const useAI = () => {
  const sdk = useSDK<DialogAppSDK<InstallationParametersWithKey>>();
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const createGPTPayload = (
    content: string,
    profile: ProfileType & { profile?: string },
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
      const model = sdk.parameters.installation.model ?? defaultModelId;
      const messages = createGPTPayload(
        prompt,
        {
          ...sdk.parameters.installation.brandProfile,
          profile: sdk.parameters.installation.profile,
        },
        targetLocale
      );

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
