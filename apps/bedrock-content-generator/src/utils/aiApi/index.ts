import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import {
  AccessDeniedException,
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from '@aws-sdk/client-bedrock-runtime';
import { ModelAvailability } from '@components/config/model/Model';
import { BedrockModel } from '@configs/aws/featuredModels';

class AI {
  model?: BedrockModel;
  decoder: TextDecoder;
  private bedrockClient: BedrockClient;
  private bedrockRuntimeClient: BedrockRuntimeClient;

  constructor(accessKeyID: string, secretAccessKey: string, region: string, model?: BedrockModel) {
    this.decoder = new TextDecoder('utf-8');

    const config = {
      region,
      credentials: {
        accessKeyId: accessKeyID,
        secretAccessKey: secretAccessKey,
      },
    };
    this.bedrockClient = new BedrockClient(config);
    this.bedrockRuntimeClient = new BedrockRuntimeClient(config);
    this.model = model;
  }

  /**
   * This function creates and returns a stream to Bedrock's API.
   * @param prompt string
   * @returns Promise<AsyncGenerator<string, void, unknown>
   */
  streamChatCompletion = async (
    systemPrompt: string,
    prompt: string
  ): Promise<AsyncGenerator<string, void, unknown> | undefined> => {
    const model = this.model!;
    console.log(`modelId: ${model.id}`);
    const stream = await this.bedrockRuntimeClient.send(
      new InvokeModelWithResponseStreamCommand(model.invokeCommand(systemPrompt, prompt, 2048))
    );

    if (!stream.body) return;

    const transformStream = async function* (
      decoder: TextDecoder,
      stream: AsyncIterable<ResponseStream>
    ) {
      for await (const chunk of stream) {
        if (chunk.chunk) {
          const textData = decoder.decode(chunk.chunk.bytes);
          const message = JSON.parse(textData);

          // response format depends on model family
          yield message[model.outputKey];
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
  getModelAvailability: (model: BedrockModel) => Promise<ModelAvailability | Error> = async (
    model: BedrockModel
  ) => {
    try {
      console.log(model);
      await this.bedrockRuntimeClient.send(new InvokeModelCommand(model.invokeCommand('', '', 1)));
    } catch (e: unknown) {
      if (!(e instanceof Error)) {
        return Error('An unexpected error has occurred');
      }
      if (e instanceof AccessDeniedException) {
        if (e.message.includes('is not authorized to perform: bedrock:InvokeModel'))
          return 'FORBIDDEN';
        if (e.message.includes("You don't have access to the model with the specified model ID."))
          return 'NOT_IN_ACCOUNT';
      }
      return e;
    }
    return 'AVAILABLE';
  };

  /**
   * This function calls Bedrock's ListFoundationModelsCommand to get a list of models.
   * @returns Promise<Response>
   */
  getModels = async () => {
    const models = await this.bedrockClient.send(new ListFoundationModelsCommand({}));

    return models.modelSummaries ?? [];
  };
}

export default AI;
