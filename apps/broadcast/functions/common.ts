import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { createClient, PlainClientAPI } from 'contentful-management';

/**
 * Installation parameters for the Broadcast app.
 * The elevenLabsApiKey is a secret parameter and is only available in backend functions.
 */
export interface AppInstallationParameters {
  elevenLabsApiKey: string;
}

/**
 * Voice object returned from ElevenLabs API
 */
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  preview_url: string;
}

/**
 * Simplified voice object for frontend consumption
 */
export interface Voice {
  voiceId: string;
  name: string;
  category: string;
  previewUrl: string;
}

/**
 * Initialize the Contentful Management client using the function context.
 */
export function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. ' +
        'To learn more about using the CMA within functions, see ' +
        'https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

/**
 * Get the ElevenLabs API key from installation parameters.
 * Throws an error if not configured.
 */
export function getElevenLabsApiKey(context: FunctionEventContext): string {
  const params = context.appInstallationParameters as AppInstallationParameters;

  if (!params?.elevenLabsApiKey) {
    throw new Error('ElevenLabs API key not configured. Please configure it in the app settings.');
  }

  return params.elevenLabsApiKey;
}
