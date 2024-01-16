import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from "@aws-sdk/client-bedrock-runtime";

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
    const modelId = "anthropic.claude-instant-v1"; // TODO: Make this dynamic
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
