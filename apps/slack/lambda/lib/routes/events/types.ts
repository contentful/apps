import { EntryProps } from 'contentful-management';

export enum SlackAppEventKey {
  PUBLISH = 'publish',
  UNPUBLISHED = 'unpublish',
  CREATED = 'create',
  DELETED = 'delete',
}

export interface SlackNotification {
  selectedChannel: string | null;
  selectedContentType: string | null;
  selectedEvent: Record<SlackAppEventKey, boolean>;
}

export interface SlackAppInstallationParameters {
  active?: boolean;
  workspaces?: string[];
  notifications?: SlackNotification[];
  installationUuid?: string;
}

export interface ResolvedEntity {
  actorId?: string;
  entryName?: string;
  date?: string;
  entity?: EventEntity;
}

// For now we only listen on events for entries
export type EventEntity = EntryProps;
