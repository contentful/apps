import {
  EntryToCreate,
  isReference,
  isReferenceArray,
} from '../../../../../../../functions/agents/documentParserAgent/schema';

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

export interface BuildTreeOptions {
  entries: Array<{
    entry: EntryToCreate;
    title: string;
    contentTypeName: string;
  }>;
  maxDepth?: number;
}

/**
 * Extracts all reference tempIds from an entry's fields
 */
function extractReferences(entry: EntryToCreate): string[] {
  const refs: string[] = [];

  Object.entries(entry.fields).forEach(([fieldName, localizedField]) => {
    Object.values(localizedField).forEach((value) => {
      if (isReference(value)) {
        refs.push(value.__ref);
      } else if (isReferenceArray(value)) {
        value.forEach((ref) => refs.push(ref.__ref));
      }
    });
  });

  return refs;
}

/**
 * Builds a tree structure from flat entry list, respecting references.
 * Entries not referenced by others become roots. Circular references are handled gracefully.
 */
export function buildEntryTree(options: BuildTreeOptions): TreeNode[] {
  const { entries, maxDepth = 4 } = options;

  // Create entry map for quick lookup
  const entryMap = new Map<
    string,
    { entry: EntryToCreate; title: string; contentTypeName: string }
  >();
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
      const node = buildNode(item, entryMap, 0, [], maxDepth, processedPaths);
      if (node) {
        rootNodes.push(node);
      }
    }
  });

  // Fallback: if all entries are in circular references, use the first one
  if (rootNodes.length === 0 && entries.length > 0) {
    const node = buildNode(entries[0], entryMap, 0, [], maxDepth, processedPaths);
    if (node) rootNodes.push(node);
  }

  return rootNodes;
}

/**
 * Recursively builds a tree node with its children
 */
function buildNode(
  item: { entry: EntryToCreate; title: string; contentTypeName: string },
  entryMap: Map<string, { entry: EntryToCreate; title: string; contentTypeName: string }>,
  level: number,
  path: string[],
  maxDepth: number,
  processedPaths: Set<string>
): TreeNode | null {
  const nodeId = item.entry.tempId || `entry_${Math.random()}`;
  const nodePath = [...path, nodeId];
  const pathKey = nodePath.join('/');

  // Stop at max depth
  if (level >= maxDepth) {
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
  const refs = extractReferences(item.entry);

  const children: TreeNode[] = [];
  refs.forEach((ref) => {
    const childItem = entryMap.get(ref);
    if (childItem) {
      const childNode = buildNode(
        childItem,
        entryMap,
        level + 1,
        nodePath,
        maxDepth,
        processedPaths
      );
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
export function isLastChild(node: TreeNode, allNodes: TreeNode[]): boolean {
  if (node.level === 0) return true;

  const parentPath = node.path.slice(0, -1);
  const siblings = allNodes.filter(
    (n) => n.level === node.level && n.path.slice(0, -1).join('/') === parentPath.join('/')
  );

  return siblings[siblings.length - 1]?.id === node.id;
}
