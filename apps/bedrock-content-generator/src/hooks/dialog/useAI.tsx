import AppInstallationParameters from '@components/config/appInstallationParameters';
import { featuredModels } from '@configs/aws/featuredModels';
import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';

export type GenerateMessage = (prompt: string, targetLocale: string) => Promise<string>;

const useAI = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const resetOutput = () => {
    setOutput('');
    setError(null);
    setHasError(false);
  };

  const generateMessage = async (prompt: string, targetLocale: string): Promise<string> => {
    resetOutput();
    setIsGenerating(true);

    try {
      const { model: modelId, region, brandProfile, profile } = sdk.parameters.installation;
      const featuredModel = featuredModels.find((m) => m.id === modelId);
      const invokeId = featuredModel?.getInvokeId
        ? featuredModel.getInvokeId(region)
        : (modelId ?? featuredModels[0].id);

      const systemPrompt = baseSystemPrompt(
        { ...brandProfile, profile },
        targetLocale
      );

      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          appDefinitionId: sdk.ids.app!,
          appActionId: 'bedrockProxyAction',
        },
        {
          parameters: {
            systemPrompt,
            prompt,
            model: invokeId,
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

  const stopMessageGeneration = () => {
    // No-op: App Actions are not streaming; generation cannot be cancelled mid-flight.
  };

  return {
    generateMessage,
    isGenerating,
    output,
    setOutput,
    resetOutput,
    error,
    hasError,
    stopMessageGeneration,
  };
};

export default useAI;
