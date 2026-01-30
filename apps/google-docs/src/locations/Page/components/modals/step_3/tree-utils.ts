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

  console.log('🌲 [buildEntryTree] Starting with', entries.length, 'entries, maxDepth:', maxDepth);

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

  // Find all tempIds that are referenced by other entries
  const referencedTempIds = new Set<string>();
  entries.forEach((item) => {
    const refs = extractReferences(item.entry);
    refs.forEach((ref) => referencedTempIds.add(ref));
  });

  console.log('🎯 Referenced entries:', Array.from(referencedTempIds));

  // Build roots: entries not referenced by others OR entries without tempId
  const rootNodes: TreeNode[] = [];
  const processedPaths = new Set<string>();

  entries.forEach((item) => {
    const isRoot = !item.entry.tempId || !referencedTempIds.has(item.entry.tempId);

    if (isRoot) {
      console.log('🌱 Building root:', item.entry.tempId || 'no-tempId', '-', item.title);
      const node = buildNode(item, entryMap, 0, [], maxDepth, processedPaths);
      if (node) {
        console.log('  ✅ Root built with', node.children.length, 'children');
        rootNodes.push(node);
      }
    }
  });

  // Fallback: if all entries are in circular references, use the first one
  if (rootNodes.length === 0 && entries.length > 0) {
    console.log('⚠️ No roots found (circular graph). Using first entry as root.');
    const node = buildNode(entries[0], entryMap, 0, [], maxDepth, processedPaths);
    if (node) rootNodes.push(node);
  }

  console.log(
    '🎉 Tree built:',
    rootNodes.length,
    'roots,',
    flattenTree(rootNodes).length,
    'total nodes'
  );
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

  console.log(`${'  '.repeat(level)}🔨 [${nodeId}] "${item.title}" at level ${level}`);

  // Stop at max depth
  if (level >= maxDepth) {
    console.log(`${'  '.repeat(level)}   ⛔ Max depth reached`);
    return null;
  }

  // Handle circular reference
  if (path.includes(nodeId)) {
    console.log(`${'  '.repeat(level)}   🔄 Circular reference detected`);
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
    console.log(`${'  '.repeat(level)}   ⏭️ Already processed`);
    return null;
  }
  processedPaths.add(pathKey);

  // Build children
  const refs = extractReferences(item.entry);
  console.log(`${'  '.repeat(level)}   📎 ${refs.length} references`);

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

  console.log(`${'  '.repeat(level)}   ✅ Complete: ${children.length} children`);

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
