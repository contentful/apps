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

  constructor(
    accessKeyID: string,
    secretAccessKey: string,
    model?: string,
    region = "us-east-1",
  ) {
    this.model = model;
    this.decoder = new TextDecoder("utf-8");
    const config = {
      region,
      credentials: {
        accessKeyId: accessKeyID,
        secretAccessKey: secretAccessKey,
      },
    };

    this.bedrockClient = new BedrockClient(config);
    this.bedrockRuntimeClient = new BedrockRuntimeClient(config);
  }

  /**
   * This function creates and returns a stream to OpenAI's API.
   * @param payload ChatCompletionRequestMessage[]
   * @returns ReadableStreamDefaultReader<Uint8Array>
   */
  streamChatCompletion = async (
    payload: ChatCompletionRequestMessage[],
    modelId: string,
  ) => {
    const stream = await this.bedrockRuntimeClient.send(
      new InvokeModelWithResponseStreamCommand({
        modelId,
        body: "hello",
      }),
    );

    // listen to stream.body, which is AsyncIterable<ResponseStream> | undefined

    if (!stream.body) return;

    for await (const chunk of stream.body) {
      if (chunk.chunk) {
        const textData = this.decoder.decode(chunk.chunk.bytes);
        console.log(textData);
      }
    }


    throw new Error("Not implemented");

    // const headers = {
    //   Authorization: `Bearer ${this.apiKey}`,
    //   "Content-Type": "application/json",
    //   responseType: "stream",
    // };

    // const body = JSON.stringify({
    //   model: this.model,
    //   messages: payload,
    //   stream: true,
    // });

    // const streamResponse = await fetch(this.baseUrl, {
    //   method: "POST",
    //   headers,
    //   body,
    // });

    // if (streamResponse.status === 200) {
    //   const stream = streamResponse.body?.getReader();
    //   return stream;
    // } else {
    //   const streamJson = await streamResponse.json();
    //   validateResponseStatus(streamResponse, streamJson);
    // }
  };

  /**
   * Use this function in a while loop to parse the stream returned from OpenAI's API.
   * This function will return false if the stream is done.
   * @param stream ReadableStreamDefaultReader<Uint8Array>
   * @returns string | false
   */
  parseStream = async (stream: ReadableStreamDefaultReader<Uint8Array>) => {
    const { done, value } = await stream.read();

    if (done) {
      return false;
    }

    const dataList = this.decoder.decode(value as Buffer);
    const lines = dataList.split(/\n{2}/);

    const textData = lines.reduce(streamToParsedText, "");

    if (textData) {
      return textData;
    }

    return "";
  };

  /**
   * This function will send a stop signal to OpenAI's API.
   * @param stream ReadableStreamDefaultReader<Uint8Array> | null
   * @returns void
   */
  sendStopSignal = (
    stream: ReadableStreamDefaultReader<Uint8Array> | null | undefined,
  ) => {
    if (stream) {
      stream.cancel();
    }
  };

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
