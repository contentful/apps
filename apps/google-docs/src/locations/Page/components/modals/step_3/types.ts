import { EntryToCreate } from '../../../../../../functions/agents/documentParserAgent/schema';

export interface PreviewEntry {
  entry: EntryToCreate;
  title: string;
  contentTypeName: string;
}
