import baseSystemPrompt from '@configs/ai/baseSystemPrompt';
import baseUrl from '@configs/ai/baseUrl';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import AI from '@utils/AI';
import { ChatCompletionRequestMessage } from 'openai';
import { useMemo, useState } from 'react';

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

  const createGPTPayload = (
    content: string,
    profile: string,
    targetLocale: string
  ): ChatCompletionRequestMessage[] => {
    const userPrompt: ChatCompletionRequestMessage = {
      role: 'user',
      content,
    };

    return [...baseSystemPrompt(profile, sdk.locales.names[targetLocale]), userPrompt];
  };

  const resetOutput = () => {
    setOutput('');
  };

  const generateMessage = async (prompt: string, targetLocale: string) => {
    let completeMessage = '';

    try {
      const payload = createGPTPayload(prompt, sdk.parameters.installation.profile, targetLocale);

      const stream = await ai.streamChatCompletion(payload);
      setStream(stream);

      while (true) {
        const streamOutput = await ai.parseStream(stream);

        if (streamOutput === false) {
          break;
        }

        setOutput((prev) => prev + streamOutput);
        completeMessage += streamOutput;
      }
    } catch (error: any) {
      console.error(error);
    }

    setStream(null);
    return completeMessage;
  };

  const sendStopSignal = async () => {
    try {
      await ai.sendStopSignal(stream);
      setStream(null);
    } catch (error: any) {
      console.error(error);
    }
  };

  return {
    generateMessage,
    output,
    resetOutput,
    sendStopSignal,
  };
};

export default useAI;
