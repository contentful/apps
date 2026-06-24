import type { ExperienceAPI } from '@contentful/app-sdk';
import type { CollectedNode } from './types';

/**
 * Walks the experience tree and resolves each node's properties into the
 * SDK-independent {@link CollectedNode} shape the audit engine consumes.
 *
 * `getRootNodes()` returns the top-level nodes; this example audits those
 * directly. A production app would additionally descend through slot
 * descriptors (`getSlotDescriptor().currentItems`) to cover nested components —
 * the same `getNode` + `getProperties` pattern, applied recursively.
 */
export async function collectNodes(experience: ExperienceAPI): Promise<CollectedNode[]> {
  const roots = experience.getRootNodes();

  const collected = await Promise.all(
    roots.map(async (node) => {
      try {
        const properties = await node.getProperties();
        return {
          id: node.id,
          nodeType: node.nodeType,
          properties,
        } satisfies CollectedNode;
      } catch {
        // A node may have been removed mid-traversal; skip it rather than
        // failing the whole audit.
        return null;
      }
    })
  );

  return collected.filter((node): node is CollectedNode => node !== null);
}
