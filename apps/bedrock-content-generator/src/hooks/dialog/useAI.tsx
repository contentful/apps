import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
import { featuredModels } from '@configs/aws/featuredModels';
import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';

export type GenerateMessage = (prompt: string, targetLocale: string) => Promise<string>;

const useAI = () => {
  const sdk = useSDK<DialogAppSDK<PersistedInstallationParameters>>();
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
      const installation = sdk.parameters.installation;
      const { model: modelId, region } = installation;
      const featuredModel = featuredModels.find((m) => m.id === modelId);
      const invokeId = featuredModel?.getInvokeId
        ? featuredModel.getInvokeId(region)
        : modelId ?? featuredModels[0].id;

      const systemPrompt = baseSystemPrompt(installation, targetLocale);

      const result = await sdk.cma.appActionCall.createWithResult(
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

      if (result.sys.status !== 'succeeded') {
        const msg = result.sys.status === 'failed' ? result.sys.error?.message : undefined;
        throw new Error(msg ?? 'App action call failed');
      }

      const body = result.sys.result as { text: string };
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
