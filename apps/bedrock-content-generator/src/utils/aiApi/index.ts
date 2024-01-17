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
 * This class is used to interact with the Bedrock API.
 * Allowing us to create and manage a stream to the API, similar to openai's node package.
 * @param baseUrl string
 * @param apiKey string
 * @param model string
 */
class AI {
  modelId?: string;
  decoder: TextDecoder;
  private bedrockClient: BedrockClient;
  private bedrockRuntimeClient: BedrockRuntimeClient;

  constructor(
    accessKeyID: string,
    secretAccessKey: string,
    region: string,
    modelId?: string,
  ) {
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
    this.modelId = modelId;
  }

  /**
   * This function creates and returns a stream to Bedrock's API.
   * @param prompt string
   * @returns Promise<AsyncGenerator<string, void, unknown>
   */
  streamChatCompletion = async (
    prompt: string,
  ): Promise<AsyncGenerator<string, void, unknown> | undefined> => {
    console.log(`modelId: ${this.modelId}`);
    const stream = await this.bedrockRuntimeClient.send(
      new InvokeModelWithResponseStreamCommand({
        modelId: this.modelId,
        contentType: "application/json",
        body: JSON.stringify({
          // TODO this is Claude specific
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
