import { PreviewEntry, TreeNode } from './tree-utils';
import { extractReferences } from './tree-utils';

const MAX_TREE_DEPTH = 4;

/**
 * Recursively builds a tree node with its children
 */
export function buildNode(
  item: PreviewEntry,
  entryMap: Map<string, PreviewEntry>,
  level: number,
  path: string[],
  processedPaths: Set<string>
): TreeNode | null {
  const nodeId = item.entry.tempId || `entry_${Math.random()}`;
  const nodePath = [...path, nodeId];
  const pathKey = nodePath.join('/');
  console.log('step 3:nodeId item', item, nodeId);
  console.log('step 3:nodePath', nodePath);
  console.log('step 3:pathKey', pathKey);

  // Stop at max depth
  if (level >= MAX_TREE_DEPTH) {
    return null;
  }

  // Handle circular reference
  if (path.includes(nodeId)) {
    return {
      id: nodeId,
      tempId: item.entry.tempId,
      contentTypeId: item.entry.contentTypeId,
      title: item.title,
      contentTypeName: item.contentTypeName,
      entry: item.entry,
      children: [],
      level,
      path: nodePath,
      hasChildren: false,
      isCircular: true,
    };
  }

  // Avoid processing same path twice
  if (processedPaths.has(pathKey)) {
    return null;
  }
  processedPaths.add(pathKey);

  console.log('step 4:processedPaths', processedPaths);

  // Build children
  const referenceTempIds = extractReferences(item.entry);

  const children: TreeNode[] = [];
  referenceTempIds.forEach((ref) => {
    const childItem = entryMap.get(ref);
    if (childItem) {
      const childNode = buildNode(childItem, entryMap, level + 1, nodePath, processedPaths);
      if (childNode) children.push(childNode);
    }
  });

  console.log('step 5:children', children);

  return {
    id: nodeId,
    tempId: item.entry.tempId,
    contentTypeId: item.entry.contentTypeId,
    title: item.title,
    contentTypeName: item.contentTypeName,
    entry: item.entry,
    children,
    level,
    path: nodePath,
    hasChildren: children.length > 0,
  };
}
