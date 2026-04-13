import {
  NormalizedDocument,
  NormalizedDocumentContentBlock,
  NormalizedDocumentTabBlock,
} from '@types';
import { NormalizedDocumentTable } from '@types';

export type DocSegment =
  | { kind: 'block'; id: string; position: number; block: NormalizedDocumentContentBlock }
  | { kind: 'table'; id: string; position: number; table: NormalizedDocumentTable };

export interface Tab {
  id: string;
  name: string;
  segments: DocSegment[];
}

interface Document {
  tabs: Tab[];
  allSegments: DocSegment[];
}

export const buildDocument = (normalizedDocument: NormalizedDocument): Document => {
  type SortableItem =
    | { kind: 'block'; position: number; block: NormalizedDocumentContentBlock }
    | { kind: 'table'; position: number; table: NormalizedDocumentTable }
    | { kind: 'tab'; position: number; tab: NormalizedDocumentTabBlock };

  const allItems: SortableItem[] = [];

  normalizedDocument.contentBlocks.forEach((block) => {
    if (block.type === 'tab') {
      allItems.push({ kind: 'tab', position: block.position, tab: block });
    } else {
      allItems.push({ kind: 'block', position: block.position, block });
    }
  });

  normalizedDocument.tables.forEach((table) => {
    allItems.push({ kind: 'table', position: table.position, table });
  });

  allItems.sort((a, b) => a.position - b.position);

  const tabs: Tab[] = [];
  let currentTab: Tab | null = null;

  allItems.forEach((item) => {
    if (item.kind === 'tab') {
      currentTab = { id: item.tab.id, name: item.tab.name, segments: [] };
      tabs.push(currentTab);
      return;
    }

    if (!currentTab) {
      currentTab = { id: normalizedDocument.documentId, name: '', segments: [] };
      tabs.push(currentTab);
    }

    if (item.kind === 'block') {
      currentTab.segments.push({
        kind: 'block',
        id: item.block.id,
        position: item.position,
        block: item.block,
      });
    } else {
      currentTab.segments.push({
        kind: 'table',
        id: item.table.id,
        position: item.position,
        table: item.table,
      });
    }
  });

  if (tabs.length === 0) {
    tabs.push({ id: normalizedDocument.documentId, name: '', segments: [] });
  }

  return { tabs, allSegments: tabs.flatMap((tab) => tab.segments) };
};
