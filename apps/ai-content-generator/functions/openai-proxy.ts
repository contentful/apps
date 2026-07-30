import type {
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';

export type OpenAiProxyParameters = {
  messages: string;
  model: string;
};

type OpenAiProxyResponse = {
  text: string;
};

type InstallationParameters = {
  key: string;
  model: string;
  profile: string;
  brandProfile: Record<string, string | undefined>;
};

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  OpenAiProxyParameters
> = async (
  event: AppActionRequest<'Custom', OpenAiProxyParameters>,
  context: FunctionEventContext
): Promise<OpenAiProxyResponse> => {
  const { key } = context.appInstallationParameters as InstallationParameters;

  if (!key) {
    throw new Error('OpenAI API key is not configured');
  }

  const { messages, model } = event.body;

  const parsedMessages = JSON.parse(messages);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: parsedMessages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI request failed: ${response.status} ${errorBody?.error?.message ?? response.statusText}`
    );
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';

  return { text };
};
