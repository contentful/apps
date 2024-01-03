import { ChatCompletionRequestMessage } from "openai";
import { streamToParsedText } from "./aiHelpers";
import { validateResponseStatus } from "./handleAiApiErrors";
import { defaultModelId } from "@configs/ai/gptModels";
import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from "@aws-sdk/client-bedrock-runtime";

/**
 * This class is used to interact with OpenAI's API.
 * Allowing us to create and manage a stream to the API, similar to openai's node package.
 * @param baseUrl string
 * @param apiKey string
 * @param model string
 */
class AI {
  model?: string;
  decoder: TextDecoder;
  private bedrockClient: BedrockClient;
  private bedrockRuntimeClient: BedrockRuntimeClient;

  constructor(accessKeyID: string, secretAccessKey: string, region: string) {
    this.decoder = new TextDecoder("utf-8");

    const config = {
      region,
      credentials: {
        accessKeyId: accessKeyID,
        secretAccessKey: secretAccessKey,
      },
    };

    if (!accessKeyID || !secretAccessKey)
      throw new Error("Missing access key id or secret access key");

    this.bedrockClient = new BedrockClient(config);
    this.bedrockRuntimeClient = new BedrockRuntimeClient(config);
  }

  /**
   * This function creates and returns a stream to OpenAI's API.
   * @param payload ChatCompletionRequestMessage[]
   * @returns ReadableStreamDefaultReader<Uint8Array>
   */
  streamChatCompletion = async (prompt: string) => {
    let modelId = "anthropic.claude-instant-v1";
    const stream = await this.bedrockRuntimeClient.send(
      new InvokeModelWithResponseStreamCommand({
        modelId,
        contentType: "application/json",
        body: JSON.stringify({
          prompt: prompt,
          max_tokens_to_sample: 800,
        }),
      }),
    );

    if (!stream.body) return;

    const transformStream = async function* (
      decoder: TextDecoder,
      stream: AsyncIterable<ResponseStream>,
    ) {
      for await (const chunk of stream) {
        if (chunk.chunk) {
          const textData = decoder.decode(chunk.chunk.bytes);
          const message = JSON.parse(textData) as { completion: string };

          yield message.completion;
        }
      }
      return;
    };

    return transformStream(this.decoder, stream.body);
  };

  /**
   * Use this function in a while loop to parse the stream returned from OpenAI's API.
   * This function will return false if the stream is done.
   * @param stream ReadableStreamDefaultReader<Uint8Array>
   * @returns string | false
   */
  // parseStream = async (stream: ReadableStreamDefaultReader<Uint8Array>) => {
  //   const { done, value } = await stream.read();

  //   if (done) {
  //     return false;
  //   }

  //   const dataList = this.decoder.decode(value as Buffer);
  //   const lines = dataList.split(/\n{2}/);

  //   const textData = lines.reduce(streamToParsedText, "");

  //   if (textData) {
  //     return textData;
  //   }

  //   return "";
  // };

  /**
   * This function will send a stop signal to OpenAI's API.
   * @param stream ReadableStreamDefaultReader<Uint8Array> | null
   * @returns void
   */
  // sendStopSignal = (
  //   stream: ReadableStreamDefaultReader<Uint8Array> | null | undefined,
  // ) => {
  //   if (stream) {
  //     stream.cancel();
  //   }
  // };

  /**
   * This function calls Bedrock's ListFoundationModelsCommand to get a list of models.
   * @returns Promise<Response>
   */
  getModels = async () => {
    const models = await this.bedrockClient.send(
      new ListFoundationModelsCommand({}),
    );

    return models.modelSummaries ?? [];
  };
}

export default AI;
