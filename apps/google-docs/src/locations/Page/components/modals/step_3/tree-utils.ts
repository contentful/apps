import {
  EntryToCreate,
  isReference,
  isReferenceArray,
} from '../../../../../../functions/agents/documentParserAgent/schema';

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
 * Builds a tree structure from flat entry list, respecting references
 * Entries without parents (not referenced by others) become root nodes
 */
export function buildEntryTree(options: BuildTreeOptions): TreeNode[] {
  const { entries, maxDepth = 4 } = options;

  // Create a map of tempId -> entry for quick lookup
  const entryMap = new Map<
    string,
    { entry: EntryToCreate; title: string; contentTypeName: string }
  >();
  entries.forEach((item) => {
    if (item.entry.tempId) {
      entryMap.set(item.entry.tempId, item);
    }
  });

  // Track which entries are referenced by others
  const referencedTempIds = new Set<string>();
  entries.forEach((item) => {
    const refs = extractReferences(item.entry);
    refs.forEach((ref) => referencedTempIds.add(ref));
  });
  console.log('referencedTempIds:', referencedTempIds);

  // Build tree starting from root entries (those not referenced by others)
  const rootNodes: TreeNode[] = [];
  const processedPaths = new Set<string>();

  entries.forEach((item) => {
    const isRoot = !item.entry.tempId || !referencedTempIds.has(item.entry.tempId);
    if (isRoot) {
      const node = buildNode(item, entryMap, 0, [], maxDepth, processedPaths);
      if (node) {
        rootNodes.push(node);
      }
    }
  });

  // If no root nodes found (all entries are referenced - circular scenario),
  // use the first entry as the root to ensure tree renders
  if (rootNodes.length === 0 && entries.length > 0) {
    const firstEntry = entries[0];
    const node = buildNode(firstEntry, entryMap, 0, [], maxDepth, processedPaths);
    if (node) {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

/**
 * Extracts all reference tempIds from an entry's fields
 */
function extractReferences(entry: EntryToCreate): string[] {
  const refs: string[] = [];

  Object.values(entry.fields).forEach((localizedField) => {
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
 * Checks if a node creates a circular reference
 * A circular reference occurs when an entry references itself through its ancestry
 */
function isCircular(nodeId: string, path: string[]): boolean {
  console.log('nodeId', nodeId);
  return path.includes(nodeId);
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
  console.log('buildNode', item);
  const nodeId = item.entry.tempId || `entry_${Math.random()}`;
  const nodePath = [...path, nodeId];
  const pathKey = nodePath.join('/');

  console.log('pathKey', pathKey);
  // Check if we've exceeded max depth
  if (level >= maxDepth) {
    return null;
  }

  // Check for circular reference
  const circular = isCircular(nodeId, path);

  console.log('circular', circular);
  // If circular, return the node but don't process children
  if (circular) {
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

  // Prevent processing the same path multiple times (for performance)
  if (processedPaths.has(pathKey)) {
    return null;
  }

  processedPaths.add(pathKey);

  // Extract references from this entry
  const refs = extractReferences(item.entry);

  // Build child nodes
  const children: TreeNode[] = [];
  const childRefs = refs
    .map((ref) => entryMap.get(ref))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  // Sort children: childless entries first for seamless connector appearance
  const sortedChildRefs = [...childRefs].sort((a, b) => {
    const aHasChildren = extractReferences(a.entry).length > 0;
    const bHasChildren = extractReferences(b.entry).length > 0;

    if (aHasChildren && !bHasChildren) return 1;
    if (!aHasChildren && bHasChildren) return -1;
    return 0;
  });

  sortedChildRefs.forEach((childItem) => {
    const childNode = buildNode(childItem, entryMap, level + 1, nodePath, maxDepth, processedPaths);
    if (childNode) {
      children.push(childNode);
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
