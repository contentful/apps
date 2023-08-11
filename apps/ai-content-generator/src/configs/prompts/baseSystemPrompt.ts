import { ChatCompletionRequestMessage } from 'openai';

const baseSystemPrompt = (profile: string, locale: string): ChatCompletionRequestMessage[] => [
  {
    role: 'system',
    content: `Forget everything from the previous conversation. `,
  },
  {
    role: 'system',
    content: `You are working for a company with the following profile: ${profile} Your response should only be in ${locale}.`,
  },
];

export default baseSystemPrompt;
