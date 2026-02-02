import {
  EntryToCreate,
  isReference,
  isReferenceArray,
} from '../../../../../../../functions/agents/documentParserAgent/schema';

export interface PreviewEntry {
  entry: EntryToCreate;
  title: string;
  contentTypeName: string;
}

export interface TreeNode {
  id: string;
  tempId?: string;
  contentTypeId: string;
  title: string;
  contentTypeName: string;
  entry: EntryToCreate;
  children: TreeNode[];
  level: number;
  path: string[];
  hasChildren: boolean;
  isCircular?: boolean;
}

const MAX_TREE_DEPTH = 4;

/**
 * Extracts all reference tempIds from an entry's fields
 */
function extractReferences(entry: EntryToCreate): string[] {
  const referenceTempIds: string[] = [];

  Object.values(entry.fields).forEach((localizedField) => {
    Object.values(localizedField).forEach((fieldValue) => {
      if (isReference(fieldValue)) {
        referenceTempIds.push(fieldValue.__ref);
      } else if (isReferenceArray(fieldValue)) {
        fieldValue.forEach((ref) => referenceTempIds.push(ref.__ref));
      }
    });
  });

  return referenceTempIds;
}

/**
 * Builds a tree structure from flat entry list, respecting references.
 * Entries not referenced by others become roots. If circular references detected, shows flat list.
 */
export function buildEntryTree(entries: PreviewEntry[]): TreeNode[] {
  // Create entry map for quick lookup
  const entryMap = new Map<string, PreviewEntry>();
  entries.forEach((item) => {
    if (item.entry.tempId) {
      entryMap.set(item.entry.tempId, item);
    }
  });

  // Build roots: entries without tempId are roots (not referenced by others)
  const rootNodes: TreeNode[] = [];
  const processedPaths = new Set<string>();

  entries.forEach((item) => {
    const isRoot = !item.entry.tempId;

    if (isRoot) {
      const node = buildNode(item, entryMap, 0, [], processedPaths);
      if (node) {
        rootNodes.push(node);
      }
    }
  });

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

/**
 * Recursively builds a tree node with its children
 */
function buildNode(
  item: PreviewEntry,
  entryMap: Map<string, PreviewEntry>,
  level: number,
  path: string[],
  processedPaths: Set<string>
): TreeNode | null {
  const nodeId = item.entry.tempId || `entry_${Math.random()}`;
  const nodePath = [...path, nodeId];
  const pathKey = nodePath.join('/');

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

/**
 * Flattens tree into a list for rendering
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(node: TreeNode) {
    result.push(node);
    node.children.forEach((child) => traverse(child));
  }

  nodes.forEach((node) => traverse(node));
  return result;
}
/**
 * Check if a node is the last child of its parent
 */
export function isLeafNode(node: TreeNode, allNodes: TreeNode[]): boolean {
  if (node.level === 0) return true;

  const parentPath = node.path.slice(0, -1);
  const siblings = allNodes.filter(
    (n) => n.level === node.level && n.path.slice(0, -1).join('/') === parentPath.join('/')
  );

  return siblings[siblings.length - 1]?.id === node.id;
}
