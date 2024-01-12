import baseSystemPrompt from "@configs/prompts/baseSystemPrompt";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import AI from "@utils/aiApi";
import { ChatCompletionRequestMessage } from "openai";
import { useEffect, useMemo, useState } from "react";
import AppInstallationParameters, {
  ProfileType,
} from "@components/config/appInstallationParameters";
import { AiApiError, AiApiErrorType } from "@utils/aiApi/handleAiApiErrors";

export type GenerateMessage = (
  prompt: string,
  targetLocale: string,
) => Promise<string>;

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
        sdk.parameters.installation.accessKeyId,
        sdk.parameters.installation.secretAccessKey,
        sdk.parameters.installation.region,
      ),
    [sdk.parameters.installation],
  );
  const [output, setOutput] = useState<string>("");
  const [stream, setStream] = useState<AsyncGenerator<
    string,
    string,
    unknown
  > | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<AiApiErrorType | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const createModelPayload = (
    content: string,
    profile: ProfileType,
    targetLocale: string,
  ): string => {
    const userPrompt: ChatCompletionRequestMessage = {
      role: "user",
      content,
    };

    function chatCompletionRequestMessageToClaudePrompt(
      msgs: ChatCompletionRequestMessage[],
    ): string {
      return msgs
        .map((msg) => {
          let role = "";
          switch (msg.role) {
            case "user":
              role = "Assistant";
              break;
            case "system":
              role = "Human";
              break;
            case "assistant":
              role = "Assistant";
              break;
          }

          return `${role}: ${msg.content}`;
        })
        .join("\n");
    }

    let answer = chatCompletionRequestMessageToClaudePrompt([
      ...baseSystemPrompt(profile, targetLocale),
      userPrompt,
    ]);

    answer += "\nAssistant:";

    return answer;
  };

  const resetOutput = () => {
    setOutput("");
    setError(null);
    setStream(null);

    setHasError(false);
  };

  const generateMessage = async (prompt: string, targetLocale: string) => {
    resetOutput();
    let completeMessage = "";
    setIsGenerating(true);

    try {
      const payload = createModelPayload(
        prompt,
        {
          ...sdk.parameters.installation.brandProfile,
          profile: sdk.parameters.installation.profile,
        },
        targetLocale,
      );

      const stream = await ai.streamChatCompletion(payload);
      if (!stream) throw new Error("Stream is null");

      for await (const streamOutput of stream) {
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
      setIsGenerating(false);
      setStream(null);
    }

    return completeMessage;
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
    error,
    hasError,
  };
};

export default useAI;
