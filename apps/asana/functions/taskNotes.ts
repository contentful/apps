import type { FunctionEventContext } from '@contentful/node-apps-toolkit';

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export function buildEntryUrl(context: FunctionEventContext, entryId: string) {
  return `https://app.contentful.com/spaces/${context.spaceId}/environments/${context.environmentId}/entries/${entryId}`;
}

// Ensures an Asana task's notes link back to a given Contentful entry, regardless of whether the
// caller (Sidebar, Automation, etc.) already included a link of its own. Skips appending if the
// link is already present, so this is safe to call repeatedly (e.g. once per entry a task gets
// linked to) without piling up duplicate lines.
export function appendEntryLink(notes: string | undefined, entryUrl: string) {
  const trimmedNotes = getTrimmedValue(notes);
  if (trimmedNotes.includes(entryUrl)) {
    return trimmedNotes;
  }

  const linkLine = `Contentful entry: ${entryUrl}`;
  return trimmedNotes ? `${trimmedNotes}\n\n${linkLine}` : linkLine;
}
