import { PreviewEntry, TreeNode } from './tree-utils';
import { buildNode } from './build-node';

/**
 * Builds a tree structure from flat entry list, respecting references.
 * Entries not referenced by others become roots. If circular references detected, shows flat list.
 */
export function buildEntryTree(entries: PreviewEntry[]): TreeNode[] {
  // Create entry map for quick lookup -- for referenced entries
  const entryMap = new Map<string, PreviewEntry>();
  entries.forEach((item) => {
    if (item.entry.tempId) {
      entryMap.set(item.entry.tempId, item);
    }
  });

  console.log('step 0:entryMap', entryMap);

  // Build roots: entries without tempId are roots (not referenced by others)
  const rootNodes: TreeNode[] = [];
  const processedPaths = new Set<string>();
  console.log('step 1:processedPaths', processedPaths);

  entries.forEach((item) => {
    const isRoot = !item.entry.tempId;

    if (isRoot) {
      const node = buildNode(item, entryMap, 0, [], processedPaths);

      console.log('step 2:node', node);
      if (node) {
        rootNodes.push(node);
      }
    }
  });

  console.log('step 2.1: rootNodes', rootNodes);

  // Fallback: if ALL entries contain circular references, show flat list without hierarchy
  if (rootNodes.length === 0 && entries.length > 0) {
    return entries.map((item) => ({
      id: item.entry.tempId || `entry_${Math.random()}`,
      tempId: item.entry.tempId,
      contentTypeId: item.entry.contentTypeId,
      title: item.title,
      contentTypeName: item.contentTypeName,
      entry: item.entry,
      children: [],
      level: 0,
      path: [item.entry.tempId || `entry_${Math.random()}`],
      hasChildren: false,
    }));
  }

  return rootNodes;
}
