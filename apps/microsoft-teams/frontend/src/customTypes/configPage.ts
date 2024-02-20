export enum AppEventKey {
  ENTRY_PUBLISH = 'ContentManagement.Entry.publish',
  ENTRY_UNPUBLISHED = 'ContentManagement.Entry.unpublish',
  ENTRY_CREATED = 'ContentManagement.Entry.create',
  ENTRY_DELETED = 'ContentManagement.Entry.delete',
  ENTRY_ARCHIVE = 'ContentManagement.Entry.archive',
  ENTRY_UNARCHIVE = 'ContentManagement.Entry.unarchive',
}

export interface AppInstallationParameters {
  tenantId: string;
  orgName: string;
  orgLogo: string;
  authenticatedUsername: string;
  notifications: Notification[];
}

export interface Notification {
  channel: TeamsChannel;
  contentTypeId: string;
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
