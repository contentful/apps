export type Provider = 'anthropic' | 'openai' | 'bedrock' | 'azure' | 'google';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: string[];
  isStreaming?: boolean;
}

export interface AppInstallationParameters {
  provider?: Provider;
  modelId?: string;
  // Anthropic / OpenAI / Google
  apiKey?: string;
  // AWS Bedrock
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsRegion?: string;
  // Azure OpenAI
  azureApiKey?: string;
  azureResourceName?: string;
}
