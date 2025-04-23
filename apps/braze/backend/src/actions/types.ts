import {
  EntryArchiveEventPayload,
  EntryAutosaveEventPayload,
  EntryCreateEventPayload,
  EntryDeleteEventPayload,
  EntryPublishEventPayload,
  EntrySaveEventPayload,
  EntryUnarchiveEventPayload,
  EntryUnpublishEventPayload,
} from '@contentful/node-apps-toolkit';

export type EntryPayload =
  | EntryCreateEventPayload
  | EntrySaveEventPayload
  | EntryAutosaveEventPayload
  | EntryPublishEventPayload
  | EntryUnpublishEventPayload
  | EntryArchiveEventPayload
  | EntryUnarchiveEventPayload
  | EntryDeleteEventPayload;

type EntryDeletePayload = EntryUnpublishEventPayload | EntryDeleteEventPayload;

type EntryNotDeletePayload = Exclude<EntryPayload, EntryDeletePayload>;

// Type guard to check if body has metadata property
export function hasMetadata(body: EntryPayload): body is EntryNotDeletePayload {
  return 'metadata' in body;
}

// Type guard to check if sys has updatedBy property
export function hasUpdatedBy(body: EntryPayload): body is EntryNotDeletePayload {
  return 'updatedBy' in body.sys;
}

// Type guard to check if sys has deletedBy property
export function hasDeletedBy(body: EntryPayload): body is EntryDeletePayload {
  return 'deletedBy' in body.sys;
}
