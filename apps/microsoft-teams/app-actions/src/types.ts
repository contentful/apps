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

export type Channel = {
  id: string;
  tenantId: string;
  name: string;
  teamId: string;
  teamName: string;
};

import { ChannelInfo as MSChannelInfo, TeamDetails as MSTeamDetails } from 'botbuilder';

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
