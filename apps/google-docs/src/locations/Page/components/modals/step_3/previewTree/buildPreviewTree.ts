import { PreviewEntry } from '../PreviewModal';
import { FlatTreeNode } from './types';

function isReference(value: unknown): value is { __ref: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__ref' in value &&
    typeof (value as { __ref: string }).__ref === 'string'
  );
}

function isReferenceArray(value: unknown): value is Array<{ __ref: string }> {
  return Array.isArray(value) && value.length > 0 && value.every(isReference);
}

/**
 * Extracts all tempIds that are referenced by a given entry
 */
function getReferencedTempIds(entry: PreviewEntry): string[] {
  const refs: string[] = [];
  const { fields } = entry.entry;

  Object.values(fields).forEach((localizedField) => {
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
 * Builds a flat list of tree nodes showing entries and their references up to 3 levels deep.
 * Entries that are referenced by other entries are not shown at the root level.
 */
export function buildPreviewTree(entries: PreviewEntry[]): FlatTreeNode[] {
  const flatNodes: FlatTreeNode[] = [];
  const visited = new Set<string>();
  const MAX_DEPTH = 3;

  // Create a lookup map by tempId
  const entryMap = new Map<string, PreviewEntry>();
  entries.forEach((entry) => {
    if (entry.entry.tempId) {
      entryMap.set(entry.entry.tempId, entry);
    }
  });

  // Collect all tempIds that are referenced by other entries
  const referencedTempIds = new Set<string>();
  entries.forEach((entry) => {
    const refs = getReferencedTempIds(entry);
    refs.forEach((refId) => referencedTempIds.add(refId));
  });

  /**
   * Recursively adds child references up to maxDepth
   * @param parentEntry - The parent entry to process
   * @param parentNodeId - The parent node ID for building the path
   * @param currentLevel - Current nesting level
   * @param maxDepth - Maximum depth to recurse
   */
  function addChildReferences(
    parentEntry: PreviewEntry,
    parentNodeId: string,
    currentLevel: number,
    maxDepth: number
  ): void {
    if (currentLevel > maxDepth) {
      return;
    }

    const refTempIds = getReferencedTempIds(parentEntry);

    refTempIds.forEach((refTempId) => {
      const referencedEntry = entryMap.get(refTempId);
      if (referencedEntry) {
        const childId = `${parentNodeId}->${refTempId}`;

        // Avoid circular references - don't show if we've already processed this path
        if (!visited.has(childId)) {
          visited.add(childId);

          flatNodes.push({
            id: childId,
            entry: referencedEntry.entry,
            title: referencedEntry.title,
            contentTypeName: referencedEntry.contentTypeName,
            level: currentLevel,
            parentId: parentNodeId,
          });

          // Recursively add children of this reference
          addChildReferences(referencedEntry, childId, currentLevel + 1, maxDepth);
        }
      }
    });
  }

  // Process each entry - only show at root level if not referenced by others
  entries.forEach((entry) => {
    const entryId = entry.entry.tempId || `entry-${flatNodes.length}`;

    // Skip entries at root level if they're already shown as children
    if (entry.entry.tempId && referencedTempIds.has(entry.entry.tempId)) {
      return;
    }

    // Add the entry itself at level 0
    flatNodes.push({
      id: entryId,
      entry: entry.entry,
      title: entry.title,
      contentTypeName: entry.contentTypeName,
      level: 0,
    });

    // Add all child references recursively up to MAX_DEPTH
    addChildReferences(entry, entryId, 1, MAX_DEPTH);
  });

  return flatNodes;
}
