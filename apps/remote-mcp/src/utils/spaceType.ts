import type { ContentLifecycleEntityKey } from '../components/types/config';

export type SpaceDisposition = 'exo' | 'classic' | 'empty' | 'unknown';

/**
 * Minimal shape of the App SDK CMA client this probe needs. The
 * react-apps-toolkit CMA adapter injects the current space/environment, so
 * calls omit spaceId/environmentId.
 */
export interface ProbeCma {
  componentType: {
    getMany: (args: { query?: { limit?: number } }) => Promise<{
      total?: number;
      items: unknown[];
    }>;
  };
  contentType: {
    getMany: (args: { query?: { limit?: number } }) => Promise<{
      total?: number;
      items: unknown[];
    }>;
  };
}

/**
 * Classifies the current space/environment as ExO-in-use, classic-in-use, or
 * empty based on Component Type presence. Ports the server's
 * detectExoDisposition (remote-mcp-server/server/mcp/detect-exo-disposition.ts).
 * Returns 'unknown' on any error so callers can fail closed.
 */
export async function detectSpaceDisposition(cma: ProbeCma): Promise<SpaceDisposition> {
  try {
    const componentTypes = await cma.componentType.getMany({ query: { limit: 1 } });
    if ((componentTypes.total ?? componentTypes.items.length) > 0) {
      return 'exo';
    }

    const contentTypes = await cma.contentType.getMany({ query: { limit: 1 } });
    return (contentTypes.total ?? contentTypes.items.length) > 0 ? 'classic' : 'empty';
  } catch {
    return 'unknown';
  }
}

/** ExO rows are shown only in ExO-enabled or empty spaces. Fail closed otherwise. */
export function shouldShowExoRows(disposition: SpaceDisposition): boolean {
  return disposition === 'exo' || disposition === 'empty';
}

/**
 * Returns the entity keys to render as rows. Hides ExO entities when the
 * disposition does not warrant showing them (classic / unknown).
 */
export function getVisibleEntities(
  disposition: SpaceDisposition,
  allEntities: ContentLifecycleEntityKey[],
  exoEntities: ContentLifecycleEntityKey[],
): ContentLifecycleEntityKey[] {
  if (shouldShowExoRows(disposition)) {
    return allEntities;
  }
  const exoSet = new Set<ContentLifecycleEntityKey>(exoEntities);
  return allEntities.filter((entity) => !exoSet.has(entity));
}
