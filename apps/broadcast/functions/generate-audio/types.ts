import type { AppActionRequest } from '@contentful/node-apps-toolkit';

export type GenerateAudioRequest = {
  entryId: string;
  fieldId: string;
  targetLocale: string;
  voiceId?: string;
};

export type GenerateAudioResult = {
  status: 'success';
  assetId: string;
  url: string;
  locale: string;
};

export type AppInstallationParameters = {
  elevenLabsApiKey?: string;
  useMockAi?: boolean | string;
  voiceId?: string;
};

export type AssetLink = {
  sys: {
    type: 'Link';
    linkType: 'Asset';
    id: string;
  };
};

export type EntryLink = {
  sys: {
    type: 'Link';
    linkType: 'Entry';
    id: string;
  };
};

export type GenerationLogPayload = {
  entryId: string;
  locale: string;
  charCount?: number;
  voiceId?: string;
  success: boolean;
  contentTypeId?: string;
  authorEntryId?: string;
  latencyMs?: number;
};

export type GenerateAudioActionRequest = AppActionRequest<'Custom', GenerateAudioRequest>;
