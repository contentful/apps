/**
 * Installation parameters for the Broadcast app.
 */
export interface AppInstallationParameters {
  elevenLabsApiKey: string;
}

/**
 * Voice object for UI display
 */
export interface Voice {
  voiceId: string;
  name: string;
  category: string;
  previewUrl: string;
}

/**
 * Response from getVoices action
 */
export interface GetVoicesResponse {
  voices: Voice[];
}

/**
 * Response from generateAudio action
 */
export interface GenerateAudioResponse {
  assetId: string;
  success: boolean;
  message?: string;
}
