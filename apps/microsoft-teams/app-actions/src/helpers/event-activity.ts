import { EntryProps, PlainClientAPI } from 'contentful-management';

interface EventData {
  entry: EntryProps;
  topic: string;
  eventDatetime: string;
}

export const buildEventActivity = async (eventData: EventData, cma: PlainClientAPI): Eventtkj => {};
