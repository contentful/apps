import { Provider } from '../types';

export interface ProviderConfig {
  label: string;
  defaultModel: string;
  modelPlaceholder: string;
  credentialFields: CredentialField[];
}

export interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type: 'password' | 'text';
  helpText?: string;
}

export const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-sonnet-4-6',
    modelPlaceholder: 'e.g. claude-sonnet-4-6',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API key',
        placeholder: 'sk-ant-...',
        type: 'password',
        helpText: 'Get your key at console.anthropic.com',
      },
    ],
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    modelPlaceholder: 'e.g. gpt-4o',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API key',
        placeholder: 'sk-...',
        type: 'password',
        helpText: 'Get your key at platform.openai.com',
      },
    ],
  },
  bedrock: {
    label: 'AWS Bedrock',
    defaultModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    modelPlaceholder: 'e.g. anthropic.claude-3-5-sonnet-20241022-v2:0',
    credentialFields: [
      {
        key: 'awsAccessKeyId',
        label: 'Access key ID',
        placeholder: 'AKIA...',
        type: 'password',
      },
      {
        key: 'awsSecretAccessKey',
        label: 'Secret access key',
        placeholder: '',
        type: 'password',
      },
      {
        key: 'awsSessionToken',
        label: 'Session token',
        placeholder: '',
        type: 'password',
        helpText: 'Required only for temporary credentials (SSO, assumed roles, etc.). Leave blank for long-term IAM credentials.',
      },
      {
        key: 'awsRegion',
        label: 'Region',
        placeholder: 'us-east-1',
        type: 'text',
        helpText: 'The AWS region where Bedrock is enabled.',
      },
    ],
  },
  azure: {
    label: 'Azure OpenAI',
    defaultModel: 'gpt-4o',
    modelPlaceholder: 'e.g. gpt-4o (deployment name)',
    credentialFields: [
      {
        key: 'azureApiKey',
        label: 'API key',
        placeholder: '',
        type: 'password',
      },
      {
        key: 'azureResourceName',
        label: 'Resource name',
        placeholder: 'my-azure-openai-resource',
        type: 'text',
        helpText: 'The Azure resource name (subdomain before .openai.azure.com).',
      },
    ],
  },
  google: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    modelPlaceholder: 'e.g. gemini-2.0-flash',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API key',
        placeholder: 'AIza...',
        type: 'password',
        helpText: 'Get your key at aistudio.google.com',
      },
    ],
  },
};

export const PROVIDER_OPTIONS: { value: Provider; label: string }[] = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'bedrock', label: 'AWS Bedrock' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'google', label: 'Google Gemini' },
];
