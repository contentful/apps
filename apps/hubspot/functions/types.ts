import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

export interface AppActionParameters {
  method: string;
  emailId?: string;
  name?: string;
  subject?: string;
  fromName?: string;
  replyTo?: string;
  contentBlocks?: ContentBlock[];
}

export interface HubSpotRequestContext {
  apiKey: string;
  event: AppActionRequest<'Custom', AppActionParameters>;
  context: FunctionEventContext;
}

export interface HubSpotResponse extends Record<string, unknown> {
  response?: any;
  error?: string;
}

export interface ContentBlock {
  widgetId: string;
  type: string;
  order: number;
  name: string;
  html: string;
  textContent: string;
  textPreview: string;
  characterCount: number;
  textNodes?: TextNode[];
}

export interface TextNode {
  textContent: string;
  id: string;
  text: string;
  originalText: string;
}

export type HubSpotEmail = {
  id: string;
  name: string;
  subject: string;
  content?: {
    widgets?: Record<
      string,
      {
        body?: {
          html?: string;
        };
        type?: string;
        id?: string;
        name?: string;
        order?: number;
      }
    >;
  };
  contentBlocks?: ContentBlock[];
  contentBlocksCount?: number;
};
