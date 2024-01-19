import { ChannelInfo as MSChannelInfo, TeamDetails as MSTeamDetails } from 'botbuilder';
import { TOPIC_ACTION_MAP } from './constants';

export interface ActionError {
  type: string;
  message: string;
  details?: Record<string, any>;
}

export interface AppActionCallResponseSuccess<TResult> {
  ok: true;
  data: TResult;
}

export interface AppActionCallResponseError {
  ok: false;
  errors: ActionError[];
}

export type AppActionCallResponse<T> = AppActionCallResponseSuccess<T> | AppActionCallResponseError;

export enum AppEventKey {
  PUBLISH = 'publish',
  UNPUBLISHED = 'unpublish',
  CREATED = 'create',
  DELETED = 'delete',
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
}

export type Channel = {
  id: string;
  tenantId: string;
  name: string;
  teamId: string;
  teamName: string;
};

// same object as the MS parent, but with required id and name
export interface TeamDetails extends MSTeamDetails {
  id: NonNullable<MSTeamDetails['id']>;
  name: NonNullable<MSTeamDetails['name']>;
}

// same object as the MS parent, but with required id and name
export interface ChannelInfo extends MSChannelInfo {
  id: NonNullable<MSChannelInfo['id']>;
  name: NonNullable<MSChannelInfo['name']>;
}
export interface TeamInstallation {
  conversationReferenceKey: string;
  teamDetails: TeamDetails;
  channelInfos: ChannelInfo[];
}

export interface AppInstallationParameters {
  tenantId: string;
  notifications: Notification[];
}

export interface Notification {
  channel: Channel;
  contentTypeId: string;
  isEnabled: boolean;
  selectedEvents: SelectedEvents;
}

export type SelectedEvents = {
  [K in AppEventKey]: boolean;
};

// this is jsut a simple starter for now
export interface EntryActivity {
  spaceName: string;
  contentTypeName: string;
  entryTitle: string;
  entryId: string;
  spaceId: string;
  contentTypeId: string;
  action: string; // published | deleted | created | etc
  actorName: string;
  at: string;
}

export interface EntryActivityMessage {
  channel: {
    teamId: string;
    channelId: string;
  };
  entryActivity: EntryActivity;
}

export interface MessageResponseSuccess {
  ok: true;
  data: {
    messageId: string;
  };
}

export interface MessageResponseError {
  ok: false;
  error: string;
}

export type MessageResponse = MessageResponseSuccess | MessageResponseError;

export interface MessageResult {
  notificationId: string;
  entryActivityMessage: EntryActivityMessage;
  messageResponse: MessageResponse;
}

export type Topic = keyof typeof TOPIC_ACTION_MAP;
export type Action = (typeof TOPIC_ACTION_MAP)[Topic];
export type ActionType = 'creation' | 'update' | 'deletion';
