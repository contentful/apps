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
import { ModelAvailability } from "@components/config/model/Model";

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
   * @returns Promise<ModelAvailability> with the availability status
   */
  getModelAvailability: (
    modelId: string,
  ) => Promise<ModelAvailability | Error> = async (modelId: string) => {
    try {
      const response = await this.bedrockRuntimeClient.send(
        new InvokeModelCommand({
          modelId,
          contentType: "application/json",
          body: JSON.stringify({
            prompt: "Human: \n Assistant: ",
            max_tokens_to_sample: 1,
          }),
        }),
      );
    } catch (e: any) {
      if (!e.hasOwnProperty("message") || !e.hasOwnProperty("name")) {
        return Error(e);
      }
      console.log(e.message);
      if (e.name === "AccessDeniedException") {
        console.log(e.message);
        if (
          e.message.includes(
            "is not authorized to perform: bedrock:InvokeModel",
          )
        )
          return "FORBIDDEN";
        if (
          e.message.includes(
            "You don't have access to the model with the specified model ID.",
          )
        )
          return "NOT_IN_ACCOUNT";
      }
      return e as Error;
    }
    return "AVAILABLE";
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
