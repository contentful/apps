import { ParameterDefinition } from '@contentful/ecommerce-app-base';
import { ConfigurationParameters } from './types';

export const PARAMETER_DEFINITIONS: ParameterDefinition[] = [
  {
    id: 'projectKey',
    name: 'commercetools Project Key',
    description: 'The commercetools project key',
    type: 'Symbol',
    required: true,
  },
  {
    id: 'clientId',
    name: 'Client ID',
    description: 'The client ID',
    type: 'Symbol',
    required: true,
  },
  {
    id: 'clientSecret',
    name: 'Client Secret',
    description: 'The client secret',
    type: 'Symbol',
    required: true,
  },
  {
    id: 'apiEndpoint',
    name: 'API URL',
    description: 'The commercetools API URL',
    type: 'Symbol',
    required: true,
  },
  {
    id: 'authApiEndpoint',
    name: 'Auth URL',
    description: 'The auth API URL',
    type: 'Symbol',
    required: true,
  },
  {
    id: 'mcUrl',
    name: 'Merchant Center URL',
    description:
      'The Merchant Center URL. Defaults to https://mc.europe-west1.gcp.commercetools.com',
    type: 'Symbol',
    required: false,
  },
  {
    id: 'locale',
    name: 'commercetools data locale',
    description: 'The commercetools data locale to display',
    type: 'Symbol',
    required: true,
  },
];

export function validateParameters(parameters: ConfigurationParameters): string | null {
  if ((parameters.projectKey ?? '').length < 1) {
    return 'Provide your commercetools project key.';
  }

  if ((parameters.clientId ?? '').length < 1) {
    return 'Provide your commercetools client ID.';
  }

  if ((parameters.clientSecret ?? '').length < 1) {
    return 'Provide your commercetools client secret.';
  }

  if ((parameters.apiEndpoint ?? '').length < 1) {
    return 'Provide the commercetools API URL.';
  }

  if ((parameters.authApiEndpoint ?? '').length < 1) {
    return 'Provide the commercetools auth API URL.';
  }

  if ((parameters.locale ?? '').length < 1) {
    return 'Provide the commercetools data locale.';
  }

  if (parameters.apiEndpoint?.endsWith('/')) {
    parameters.apiEndpoint = parameters.apiEndpoint?.slice(0, -1);
  }

  return null;
}
