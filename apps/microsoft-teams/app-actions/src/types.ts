import { ChannelInfo as MSChannelInfo, TeamDetails as MSTeamDetails } from 'botbuilder';
import { TOPIC_ACTION_MAP } from './constants';
import { EntryProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Channel, MessageResponse } from '../../types';

export enum AppEventKey {
  ENTRY_PUBLISH = 'ContentManagement.Entry.publish',
  ENTRY_UNPUBLISHED = 'ContentManagement.Entry.unpublish',
  ENTRY_CREATED = 'ContentManagement.Entry.create',
  ENTRY_DELETED = 'ContentManagement.Entry.delete',
  ENTRY_ARCHIVE = 'ContentManagement.Entry.archive',
  ENTRY_UNARCHIVE = 'ContentManagement.Entry.unarchive',
}

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
  orgName: string;
  orgLogo: string;
  authenticatedUsername: string;
  notifications: Notification[];
}

export interface Notification {
  channel: Channel;
  contentTypeId: string;
  contentTypeName: string;
  selectedEvents: SelectedEvents;
}

export type SelectedEvents = {
  [K in AppEventKey]: boolean;
};

// this is just a simple starter for now
export interface EntryActivity {
  contentTypeName: string;
  entryTitle: string;
  action: string; // published | deleted | created | etc
  eventDatetime: string;
  entryUrl: string;
  entryId: string;
}

export interface WorkflowUpdate {
  title: string;
  currentStep: string;
  currentStepColor: string;
  previousStep: string;
  previousStepColor: string;
  contentType: string;
  callToActionUrl: string; // URL
}

export interface WorkflowUpdateMessage {
  channel: {
    teamId: string;
    channelId: string;
  };
  workflowUpdate: WorkflowUpdate & { eventDatetime: string };
}

export interface WorkflowPayload extends WorkflowUpdate {
  teamId: string;
  channelId: string;
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

export interface SendWorkflowUpdateMessageResult {
  workflowUpdateMessage: WorkflowUpdateMessage;
  sendWorkflowUpdateResult: MsTeamsBotServiceResponse<MessageResponse>;
}

export interface EntryEvent {
  entry: EntryProps;
  topic: Topic;
  eventDatetime: string;
}

export type Topic = keyof typeof TOPIC_ACTION_MAP;
export type Action = (typeof TOPIC_ACTION_MAP)[Topic];
export type ActionType = 'creation' | 'update' | 'deletion' | 'publication';
export type AppActionRequestContext = Omit<
  AppActionCallContext['appActionCallContext'],
  'cmaHost' | 'uploadHost'
>;
