import { ChannelInfo as MSChannelInfo, TeamDetails as MSTeamDetails } from 'botbuilder';
import { TOPIC_ACTION_MAP } from './constants';
import { EntryProps } from 'contentful-management';

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
  error: ActionError;
}

export type AppActionCallResponse<T> = AppActionCallResponseSuccess<T> | AppActionCallResponseError;

export enum AppEventKey {
  ENTRY_PUBLISH = 'ContentManagement.Entry.publish',
  ENTRY_UNPUBLISHED = 'ContentManagement.Entry.unpublish',
  ENTRY_CREATED = 'ContentManagement.Entry.create',
  ENTRY_DELETED = 'ContentManagement.Entry.delete',
  ENTRY_ARCHIVE = 'ContentManagement.Entry.archive',
  ENTRY_UNARCHIVE = 'ContentManagement.Entry.unarchive',
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
  selectedEvents: SelectedEvents;
}

export type SelectedEvents = {
  [K in AppEventKey]: boolean;
};

// this is jsut a simple starter for now
export interface EntryActivity {
  contentTypeName: string;
  entryTitle: string;
  entryId: string;
  spaceId: string;
  contentTypeId: string;
  action: string; // published | deleted | created | etc
  eventDatetime: string;
}

export interface EntryActivityMessage {
  channel: {
    teamId: string;
    channelId: string;
  };
  entryActivity: EntryActivity;
}

export interface TestMessage {
  channel: {
    teamId: string;
    channelId: string;
  };
  contentTypeName: string;
}

export interface MessageResponse {
  messageResponseId: string;
}

export interface MsTeamsBotServiceSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface MsTeamsBotServiceErrorResponse {
  ok: false;
  error: ApiErrorObject;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export interface ApiErrorObject<T extends Record<string, any> = Record<string, any>> {
  type: string;
  message: string;
  details?: T;
}

export type MsTeamsBotServiceResponse<T> =
  | MsTeamsBotServiceSuccessResponse<T>
  | MsTeamsBotServiceErrorResponse;

export interface SendEntryActivityMessageResult {
  entryActivityMessage: EntryActivityMessage;
  sendMessageResult: MsTeamsBotServiceResponse<MessageResponse>;
}

export interface EntryEvent {
  entry: EntryProps;
  topic: Topic;
  eventDatetime: string;
}

export type Topic = keyof typeof TOPIC_ACTION_MAP;
export type Action = (typeof TOPIC_ACTION_MAP)[Topic];
export type ActionType = 'creation' | 'update' | 'deletion' | 'publication';
