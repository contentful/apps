export interface AppInstallationParameters {
  tenantId?: string;
  notifications?: Notification[];
}

export interface Notification {
  channelId: string;
  contentTypeId: string;
  isEnabled: boolean;
  selectedEvents: SelectedEvents;
}

export interface SelectedEvents {
  publish: boolean;
  unpublish: boolean;
  create: boolean;
  delete: boolean;
  edit: boolean;
}
