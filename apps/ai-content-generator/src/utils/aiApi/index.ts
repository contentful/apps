import { ChatCompletionRequestMessage } from 'openai';
import { streamToParsedText } from './aiHelpers';

/**
 * This class is used to interact with OpenAI's API.
 * Allowing us to create and manage a stream to the API, similar to openai's node package.
 * @param baseUrl string
 * @param apiKey string
 * @param model string
 */
class AI {
  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.decoder = new TextDecoder('utf-8');
  }

  baseUrl: string;
  apiKey: string;
  model: string;
  decoder: TextDecoder;

  /**
   * This function creates and returns a stream to OpenAI's API.
   * @param payload ChatCompletionRequestMessage[]
   * @returns ReadableStreamDefaultReader<Uint8Array>
   */
  streamChatCompletion = async (payload: ChatCompletionRequestMessage[]) => {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      responseType: 'stream',
    };

    const body = JSON.stringify({
      model: this.model,
      messages: payload,
      stream: true,
    });

    const stream = (
      await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body,
      })
    ).body?.getReader();

    if (!stream) {
      throw new Error('Unable to create stream');
    }

    return stream;
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

    const textData = lines.reduce(streamToParsedText, '');

    if (textData) {
      return textData;
    }

    return '';
  };

  /**
   * This function will send a stop signal to OpenAI's API.
   * @param stream ReadableStreamDefaultReader<Uint8Array> | null
   * @returns void
   */
  sendStopSignal = (stream: ReadableStreamDefaultReader<Uint8Array> | null) => {
    if (stream) {
      stream.cancel();
    }
  };

  /**
   * This function calls OpenAI's models endpoint in order to test whether the API Key is valid.
   * @returns Promise<boolean>
   */
  isApiKeyValid = async (): Promise<boolean> => {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const res = await fetch(this.baseUrl, {
        method: 'GET',
        headers,
      });

      return res.status === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  };
}

export default AI;
