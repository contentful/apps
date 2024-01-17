import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from "@aws-sdk/client-bedrock-runtime";

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
   * This function calls Bedrock's InvokeModelCommand to check if the model is available in the account.
   * @param modelId string
   * @returns Promise<boolean> true if model is available, false if not
   */
  isModelAvailable = async (modelId: string) => {
    return this.bedrockRuntimeClient
      .send(
        new InvokeModelCommand({
          modelId,
          contentType: "application/json",
          body: JSON.stringify({
            prompt: "Human: \n Assistant: ",
            max_tokens_to_sample: 1,
          }),
        }),
      )
      .then((res) => {
        console.log(res);
        return true;
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
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
