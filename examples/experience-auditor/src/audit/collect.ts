import type { ComponentPropertyDescriptor, ExoNodeAPI, ExperienceAPI } from '@contentful/app-sdk';
import type { CollectedNode, ResolvedBinding } from './types';

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
        const resolvedBindings = await resolveBindings(node, properties);
        return {
          id: node.id,
          nodeType: node.nodeType,
          properties,
          ...(resolvedBindings ? { resolvedBindings } : {}),
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

/**
 * Resolves each entry-bound property via the host's `resolveEntryBinding`,
 * capturing whether the reference actually resolves. Returns `undefined` when
 * the host does not back resolution (older/partial bridge) or the node has no
 * entry-bound properties, so the binding rule falls back to its structural check.
 * SDK coupling lives here, not in the rules.
 */
async function resolveBindings(
  node: ExoNodeAPI,
  properties: ComponentPropertyDescriptor[]
): Promise<Record<string, ResolvedBinding> | undefined> {
  if (typeof node.resolveEntryBinding !== 'function') return undefined;

  const entries: Array<[string, ResolvedBinding]> = [];
  for (const property of properties) {
    if (property.binding?.type !== 'entry') continue;
    const target = await node.resolveEntryBinding(property.key);
    entries.push([property.key, { resolved: target !== null }]);
  }

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
