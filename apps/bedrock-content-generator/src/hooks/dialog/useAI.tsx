import AppInstallationParameters, {
  ProfileType,
} from "@components/config/appInstallationParameters";
import { featuredModels } from "@configs/aws/featuredModels";
import baseSystemPrompt, { Message } from "@configs/prompts/baseSystemPrompt";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import AI from "@utils/aiApi";
import { AiApiError, AiApiErrorType } from "@utils/aiApi/handleAiApiErrors";
import { useEffect, useMemo, useState } from "react";

export type GenerateMessage = (
  prompt: string,
  targetLocale: string,
) => Promise<string>;

/**
 * This hook is used to generate messages using the Bedrock API
 * output will stream messages just like a chatbot
 *
 * @returns { generateMessage, resetOutput, output, sendStopSignal }
 */
const useAI = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const model = featuredModels.find(
    (m) => m.id === sdk.parameters.installation.model,
  );
  const ai = useMemo(
    () =>
      new AI(
        sdk.parameters.installation.accessKeyId,
        sdk.parameters.installation.secretAccessKey,
        sdk.parameters.installation.region,
        model,
      ),
    [sdk.parameters.installation],
  );
  const [output, setOutput] = useState<string>("");
  const [stream, setStream] = useState<AsyncGenerator<
    string,
    void,
    unknown
  > | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<AiApiErrorType | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const createPrompt = (
    content: string,
    profile: ProfileType,
    targetLocale: string,
  ): string => {
    const userPrompt: Message = {
      role: "user",
      content,
    };

    function messageToClaudePrompt(msgs: Message[]): string {
      // TODO specific for Claude, how does it work with others?
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

    let answer = messageToClaudePrompt([
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
    console.log("generateMessage prompt", prompt);
    resetOutput();
    let completeMessage = "";
    setIsGenerating(true);

    try {
      const payload = createPrompt(
        prompt,
        {
          ...sdk.parameters.installation.brandProfile,
          profile: sdk.parameters.installation.profile,
        },
        targetLocale,
      );

      const stream = await ai.streamChatCompletion(prompt);
      if (!stream) throw new Error("Stream is null");
      setStream(stream);

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
