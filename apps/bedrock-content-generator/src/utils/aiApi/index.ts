import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from "@aws-sdk/client-bedrock-runtime";
import {
  BedrockModel,
  ModelAvailability,
  ModelFamily,
} from "@components/config/model/Model";

function invokeModelPayload(
  model: BedrockModel,
  prompt: string,
  maxTokens?: number,
): InvokeModelCommandInput {
  let body = {};
  switch (model.family) {
    case "CLAUDE":
      body = {
        prompt,
        ...(maxTokens && { max_tokens_to_sample: maxTokens }),
      };
      break;
    case "LLAMA":
      body = {
        prompt,
        ...(maxTokens && { max_gen_len: maxTokens }),
      };
      break;
    // case "TITAN":
    //   body = {
    //     inputText: prompt,
    //     textGenerationConfig: {
    //       ...(maxTokens && { maxTokenCount: maxTokens }),
    //     },
    //   };
    //   break;
    // case "AI21":
    //   body = {
    //     prompt,
    //     maxTokens,
    //   };
    //   break;
    // case "COHERE":
    //   body = {
    //     prompt,
    //     max_tokens: maxTokens,
    //   };
    //   break;
  }

  return {
    modelId: model.id,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

class AI {
  model?: BedrockModel;
  decoder: TextDecoder;
  private bedrockClient: BedrockClient;
  private bedrockRuntimeClient: BedrockRuntimeClient;

  constructor(
    accessKeyID: string,
    secretAccessKey: string,
    region: string,
    model?: BedrockModel,
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
    this.model = model;
  }

  /**
   * This function creates and returns a stream to Bedrock's API.
   * @param prompt string
   * @returns Promise<AsyncGenerator<string, void, unknown>
   */
  streamChatCompletion = async (
    prompt: string,
  ): Promise<AsyncGenerator<string, void, unknown> | undefined> => {
    const model = this.model!;
    console.log(`modelId: ${model.id}`);
    console.log(`prompt: ${prompt}`);
    const stream = await this.bedrockRuntimeClient.send(
      new InvokeModelWithResponseStreamCommand(
        invokeModelPayload(model, prompt, 2048),
      ),
    );

    if (!stream.body) return;

    const outputKeys: Record<ModelFamily, string> = {
      LLAMA: "generation",
      CLAUDE: "completion",
      TITAN: "outputText",
      COHERE: "text",
    };

    const transformStream = async function* (
      decoder: TextDecoder,
      stream: AsyncIterable<ResponseStream>,
    ) {
      for await (const chunk of stream) {
        if (chunk.chunk) {
          const textData = decoder.decode(chunk.chunk.bytes);
          const message = JSON.parse(textData);

          // response format depends on model family
          yield message[outputKeys[model.family]];
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
    model: BedrockModel,
  ) => Promise<ModelAvailability | Error> = async (model: BedrockModel) => {
    try {
      await this.bedrockRuntimeClient.send(
        new InvokeModelCommand(
          invokeModelPayload(model, "Human: \n Assistant: ", 1),
        ),
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
