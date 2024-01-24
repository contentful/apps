export const TOPIC_ACTION_MAP = {
  'ContentManagement.Entry.create': 'created',
  'ContentManagement.Entry.save': 'saved',
  'ContentManagement.Entry.auto_save': 'auto saved',
  'ContentManagement.Entry.archive': 'archived',
  'ContentManagement.Entry.unarchive': 'unarchived',
  'ContentManagement.Entry.publish': 'published',
  'ContentManagement.Entry.unpublish': 'unpublished',
  'ContentManagement.Entry.delete': 'deleted',
} as const;

export enum AppEventKey {
  PUBLISH = 'ContentManagement.Entry.publish',
  UNPUBLISHED = 'ContentManagement.Entry.unpublish',
  CREATED = 'ContentManagement.Entry.create',
  DELETED = 'ContentManagement.Entry.delete',
  ARCHIVE = 'ContentManagement.Entry.archive',
  UNARCHIVE = 'ContentManagement.Entry.unarchive',
}

export interface AppInstallationParameters {
  tenantId: string;
  notifications: Notification[];
}

export interface Notification {
  channel: TeamsChannel;
  contentTypeId: string;
  isEnabled: boolean;
  selectedEvents: SelectedEvents;
}

export type SelectedEvents = {
  [K in AppEventKey]: boolean;
};

export interface TeamsChannel {
  id: string;
  tenantId: string;
  name: string;
  teamId: string;
  teamName: string;
}
