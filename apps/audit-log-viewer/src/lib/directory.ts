import type { PageAppSDK } from '@contentful/app-sdk';
import type { AuditEvent } from './events';

export interface Directory {
  users: Map<string, string>;
  spaces: Map<string, string>;
}

const PAGE = 100;

/**
 * Resolve actor ids → user names and space ids → space names via the CMA.
 * Both lookups are best-effort: a viewer without org-level permission just
 * keeps seeing raw ids.
 */
export async function fetchDirectory(sdk: PageAppSDK): Promise<Directory> {
  const users = new Map<string, string>();
  const spaces = new Map<string, string>();

  // The Contentful host only allows space-scoped CMA actions from inside an
  // app (org-scoped ones are rejected with "You can not access the action …
  // from within an app"), so resolution covers members of the current space
  // and the current space's name; actors from other org spaces keep raw ids.
  try {
    for (let skip = 0; ; skip += PAGE) {
      const page = await sdk.cma.user.getManyForSpace({
        spaceId: sdk.ids.space,
        query: { limit: PAGE, skip },
      });
      for (const u of page.items) {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
        if (name) users.set(u.sys.id, name);
      }
      if (!Number.isFinite(page.total) || skip + PAGE >= page.total || skip >= 5000) break;
    }
  } catch (err) {
    console.warn('[audit-log-viewer] user directory lookup failed:', err);
  }

  try {
    const space = await sdk.cma.space.get({});
    spaces.set(space.sys.id, space.name);
  } catch (err) {
    console.warn('[audit-log-viewer] space directory lookup failed:', err);
  }

  return { users, spaces };
}

/** Overlay resolved names onto normalized events (pure). */
export function applyDirectory(events: AuditEvent[], dir: Directory): AuditEvent[] {
  if (dir.users.size === 0 && dir.spaces.size === 0) return events;
  return events.map((e) => ({
    ...e,
    actorName: (e.actorType === 'User' && dir.users.get(e.actorId)) || e.actorName,
    spaceName: dir.spaces.get(e.spaceId) || e.spaceName,
  }));
}
