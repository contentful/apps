import baseSystemPrompt from '@configs/prompts/baseSystemPrompt';
import baseUrl from '@configs/ai/baseUrl';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import AI from '@utils/aiApi';
import { ChatCompletionRequestMessage } from 'openai';
import { useEffect, useMemo, useState } from 'react';

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
    () => new AI(baseUrl, sdk.parameters.installation.apiKey, sdk.parameters.installation.model),
    [sdk.parameters.installation]
  );
  const [output, setOutput] = useState<string>('');
  const [stream, setStream] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const createGPTPayload = (
    content: string,
    profile: string,
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
  };

  const generateMessage = async (prompt: string, targetLocale: string) => {
    resetOutput();
    let completeMessage = '';

    try {
      const payload = createGPTPayload(prompt, sdk.parameters.installation.profile, targetLocale);

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
  };
};

export default useAI;
