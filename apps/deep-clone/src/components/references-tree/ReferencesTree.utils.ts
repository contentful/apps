import { EntryProps } from 'contentful-management';
import { TreeNode } from './ReferencesTree.types';
import {
  COMMON_NAME_FIELDS,
  MAX_LEVEL,
  MORE_PLACEHOLDER,
  ASSET_CONTENT_TYPES,
  DEFAULT_LOCALE,
} from './constant';

function getDisplayName(contentTypeId: string): string {
  if (contentTypeId.toLowerCase() === 'cta') {
    return 'CTA';
  }
  // Uppercase first letter and add space before uppercase letters
  return contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1).replace(/([A-Z])/g, ' $1');
}

/**
 * Get internal name from entry fields
 */
function getInternalName(entry: EntryProps): string {
  for (const fieldName of COMMON_NAME_FIELDS) {
    if (entry.fields[fieldName]) {
      const firstLocale = Object.keys(entry.fields[fieldName])[0];
      // if default locale is in the entry fields, use it, otherwise use the first locale
      if (entry.fields[fieldName][DEFAULT_LOCALE]) {
        return entry.fields[fieldName][DEFAULT_LOCALE] as string;
      }
      return firstLocale ? (entry.fields[fieldName][firstLocale] as string) ?? '' : '';
    }
  }
  return '';
}

/**
 * Check if entry is an asset
 */
function isAssetEntry(contentTypeId: string): boolean {
  return ASSET_CONTENT_TYPES.includes(contentTypeId.toLowerCase());
}

/**
 * Find child entry IDs by examining entry fields for references
 */
function findChildIds(entry: EntryProps, referencesTree: Record<string, EntryProps>): string[] {
  const childIds: string[] = [];
  const visited = new Set<string>();

  const inspectValue = (value: any): void => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((item) => inspectValue(item));
      return;
    }

    if (value.sys && value.sys.type === 'Link' && value.sys.linkType === 'Entry') {
      const childId = value.sys.id;
      if (childId && referencesTree[childId] && !visited.has(childId)) {
        visited.add(childId);
        childIds.push(childId);
      }
    }
  };

  for (const fieldName in entry.fields) {
    const field = entry.fields[fieldName];
    for (const locale in field) {
      inspectValue(field[locale]);
    }
  }

  return childIds;
}

/**
 * Build tree structure from references
 * Prevents circular references by tracking the current path
 * Limits depth to level 10, showing "+more" placeholder for deeper levels
 */
export function buildTreeStructure(
  referencesTree: Record<string, EntryProps>,
  parentEntryId: string,
  path: string[] = [],
  level: number = 0
): TreeNode | null {
  const parentEntry = referencesTree[parentEntryId];
  if (!parentEntry) return null;

  const contentTypeId = parentEntry.sys.contentType.sys.id;
  const internalName = getInternalName(parentEntry);

  // Prevent circular references: only checks if entryId already exists in current path
  // This allows the same entry to appear in different branches of the tree
  if (path.includes(parentEntryId)) {
    // Return entry but no children to prevent infinite recursion
    // Still display all information of the entry
    const isAsset = isAssetEntry(contentTypeId);

    return {
      entryId: parentEntryId,
      entry: parentEntry,
      contentTypeId,
      displayName: getDisplayName(contentTypeId),
      internalName,
      isAsset,
      children: [], // No children to prevent infinite recursion
    };
  }

  // Add entryId to current path (after checking for circular reference)
  const currentPath = [...path, parentEntryId];
  const isAsset = isAssetEntry(contentTypeId);

  const childIds = findChildIds(parentEntry, referencesTree);

  // If we're at level 10 or above, don't build children, create a "+more" placeholder instead
  if (level >= MAX_LEVEL && childIds.length > 0) {
    // Create a special "+more" placeholder node
    const morePlaceholder: TreeNode = {
      entryId: `more-${parentEntryId}`,
      entry: parentEntry, // Use parent entry as placeholder (won't be used)
      contentTypeId: '',
      displayName: MORE_PLACEHOLDER,
      internalName: '',
      isAsset: false,
      children: [],
      isMorePlaceholder: true,
    };

    return {
      entryId: parentEntryId,
      entry: parentEntry,
      contentTypeId,
      displayName: getDisplayName(contentTypeId),
      internalName,
      isAsset,
      children: [morePlaceholder],
    };
  }

  const children: TreeNode[] = childIds
    .map((childId) => {
      // Pass currentPath (not visited) so each branch has its own path
      // Increment level for children
      const childTree = buildTreeStructure(referencesTree, childId, currentPath, level + 1);
      return childTree!;
    })
    .filter((child): child is TreeNode => child !== null);

  return {
    entryId: parentEntryId,
    entry: parentEntry,
    contentTypeId,
    displayName: getDisplayName(contentTypeId),
    internalName,
    isAsset,
    children,
  };
}

/**
 * Find a node in the tree by entryId
 */
export function findNodeInTree(node: TreeNode, targetId: string): TreeNode | null {
  if (node.entryId === targetId) {
    return node;
  }
  for (const child of node.children) {
    const found = findNodeInTree(child, targetId);
    if (found) return found;
  }
  return null;
}

/**
 * Collect all node IDs from the tree recursively
 */
export function collectAllNodeIds(node: TreeNode): Set<string> {
  const ids = new Set<string>();
  ids.add(node.entryId);
  node.children.forEach((child: TreeNode) => {
    const childIds = collectAllNodeIds(child);
    childIds.forEach((id) => ids.add(id));
  });
  return ids;
}

/**
 * Collect all descendant node IDs (children and their children recursively)
 */
export function collectDescendantIds(node: TreeNode): Set<string> {
  const ids = new Set<string>();
  node.children.forEach((child: TreeNode) => {
    ids.add(child.entryId);
    const childDescendants = collectDescendantIds(child);
    childDescendants.forEach((id) => ids.add(id));
  });
  return ids;
}

/**
 * Find all parent node IDs (ancestors) that lead to the target entryId
 */
export function findParentIds(
  tree: TreeNode,
  targetEntryId: string,
  currentPath: string[] = []
): string[] {
  // If this is the target node, return all ancestors (currentPath)
  if (tree.entryId === targetEntryId) {
    return currentPath;
  }

  // Search in children with updated path (include current node in path for children)
  const newPath = [...currentPath, tree.entryId];
  for (const child of tree.children) {
    const foundParents = findParentIds(child, targetEntryId, newPath);
    if (foundParents.length > 0) {
      // Found the target in this branch, return the ancestors
      return foundParents;
    }
  }

  return [];
}

/**
 * Collect all node paths from the tree recursively
 */
export function collectAllNodePaths(node: TreeNode, path: string = ''): Set<string> {
  const paths = new Set<string>();
  const nodePath = path ? `${path}:${node.entryId}` : node.entryId;
  paths.add(nodePath);

  node.children.forEach((child: TreeNode) => {
    const childPaths = collectAllNodePaths(child, nodePath);
    childPaths.forEach((p) => paths.add(p));
  });

  return paths;
}

/**
 * Check if a node's contentTypeId is in the block list
 */
function isNodeContentTypeBlocked(node: TreeNode, listBlockContentIds: string[]): boolean {
  return listBlockContentIds.includes(node.contentTypeId);
}

/**
 * Collect all disabled paths from the tree recursively
 * A path is disabled if:
 * - The node's contentTypeId is in listBlockContentIds, OR
 * - Any ancestor in the path has a contentTypeId in listBlockContentIds
 *
 * @param node - Current tree node
 * @param listBlockContentIds - List of content type IDs that should be disabled
 * @param path - Current path from root (e.g., "id1:id2")
 * @param hasBlockedAncestor - Whether any ancestor in the current path is blocked
 * @returns Set of all disabled paths
 */
export function collectDisabledPaths(
  node: TreeNode,
  listBlockContentIds: string[],
  path: string = '',
  hasBlockedAncestor: boolean = false
): Set<string> {
  const disabledPaths = new Set<string>();
  if (listBlockContentIds.length === 0) return disabledPaths;

  const nodePath = path ? `${path}:${node.entryId}` : node.entryId;
  const isCurrentNodeBlocked = isNodeContentTypeBlocked(node, listBlockContentIds);
  const isDisabled = hasBlockedAncestor || isCurrentNodeBlocked;

  // If this path is disabled, add it and all descendant paths
  if (isDisabled) {
    disabledPaths.add(nodePath);
    // Collect all descendant paths and mark them as disabled
    const allDescendantPaths = collectAllNodePaths(node, nodePath);
    allDescendantPaths.forEach((descendantPath) => {
      if (descendantPath !== nodePath) {
        disabledPaths.add(descendantPath);
      }
    });
  }

  // Recursively check children (pass down the disabled state)
  node.children.forEach((child) => {
    const childDisabledPaths = collectDisabledPaths(
      child,
      listBlockContentIds,
      nodePath,
      isDisabled
    );
    childDisabledPaths.forEach((p) => disabledPaths.add(p));
  });

  return disabledPaths;
}
