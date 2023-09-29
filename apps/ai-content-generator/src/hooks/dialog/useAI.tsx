import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import { chatCompletionsBaseUrl } from '@configs/ai/baseUrl';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import AI from '@utils/aiApi';
import { ChatCompletionRequestMessage } from 'openai';
import { useEffect, useMemo, useState } from 'react';
import { defaultModelId } from '@configs/ai/gptModels';
import AppInstallationParameters, {
  ProfileType,
} from '@components/config/appInstallationParameters';
import { AiApiError, AiApiErrorType } from '@utils/aiApi/handleAiApiErrors';

export type GenerateMessage = (prompt: string, targetLocale: string) => Promise<string>;

/**
 * This hook is used to generate messages using the OpenAI API
 * output will stream messages just like a chatbot
 *
 * @returns { generateMessage, resetOutput, output, sendStopSignal }
 */
const useAI = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const ai = useMemo(
    () =>
      new AI(
        chatCompletionsBaseUrl,
        sdk.parameters.installation.key,
        sdk.parameters.installation.model ?? defaultModelId
      ),
    [sdk.parameters.installation]
  );
  const [output, setOutput] = useState<string>('');
  const [stream, setStream] = useState<ReadableStreamDefaultReader<Uint8Array> | null | undefined>(
    null
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<AiApiErrorType | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const createGPTPayload = (
    content: string,
    profile: ProfileType,
    targetLocale: string
  ): ChatCompletionRequestMessage[] => {
    const userPrompt: ChatCompletionRequestMessage = {
      role: 'user',
      content,
    };

    return [...baseSystemPrompt(profile, targetLocale), userPrompt];
  };

  const resetOutput = () => {
    setOutput('');
    setError(null);
    if (stream) {
      stream.cancel();
    }
    setStream(null);

    setHasError(false);
  };

  const generateMessage = async (prompt: string, targetLocale: string) => {
    resetOutput();
    let completeMessage = '';
    setIsGenerating(true);

    try {
      const payload = createGPTPayload(
        prompt,
        {
          ...sdk.parameters.installation.brandProfile,
          profile: sdk.parameters.installation.profile,
        },
        targetLocale
      );

      const stream = await ai.streamChatCompletion(payload);
      setStream(stream);

      while (stream) {
        const streamOutput = await ai.parseStream(stream);

        if (streamOutput === false) {
          break;
        }

        setOutput((prev) => prev + streamOutput);
        completeMessage += streamOutput;
      }
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof AiApiError) {
        setError(error);
      } else {
        setError(new AiApiError({}));
      }
      setHasError(true);
      setIsGenerating(false);
    } finally {
      setStream(null);
    }

    return completeMessage;
  };

  const sendStopSignal = async () => {
    try {
      await ai.sendStopSignal(stream);
      setStream(null);
    } catch (error: unknown) {
      console.error(error);
    }
  };

  useEffect(() => {
    setIsGenerating(stream !== null);
  }, [stream]);

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
