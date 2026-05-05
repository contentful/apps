/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'contentful-management';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createCmaClient(cmaAdapter: object): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient({ apiAdapter: cmaAdapter as any }, { type: 'plain', alphaFeatures: [] });
}

export class CmaService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private spaceId: string;
  private environmentId: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: any, spaceId: string, environmentId: string) {
    this.client = client;
    this.spaceId = spaceId;
    this.environmentId = environmentId;
  }

  // ── Space & Environments ──────────────────────────────────────────────────

  async getSpaceInfo() {
    const space = await this.client.space.get({ spaceId: this.spaceId });
    return { id: space.sys.id, name: space.name };
  }

  listEnvironments() {
    // environment.getMany is not permitted from within a Contentful app context.
    // Return the current environment which is available from the SDK.
    return [{ id: this.environmentId, current: true }];
  }

  // ── Content Types ─────────────────────────────────────────────────────────

  async listContentTypes(limit = 25, skip = 0) {
    const result = await this.client.contentType.getMany({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      query: { limit, skip },
    });
    return result.items.map((ct: any) => ({
      id: ct.sys.id,
      name: ct.name,
      description: ct.description,
      fields: ct.fields?.length ?? 0,
    }));
  }

  async getContentType(contentTypeId: string) {
    const ct = await this.client.contentType.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      contentTypeId,
    });
    return {
      id: ct.sys.id,
      name: ct.name,
      description: ct.description,
      displayField: ct.displayField,
      fields: ct.fields,
    };
  }

  async createContentType(params: {
    name: string;
    description?: string;
    displayField?: string;
    fields: Array<{
      id: string;
      name: string;
      type: string;
      required?: boolean;
      localized?: boolean;
    }>;
  }) {
    const ct = await this.client.contentType.create(
      { spaceId: this.spaceId, environmentId: this.environmentId },
      {
        name: params.name,
        description: params.description ?? '',
        displayField: params.displayField ?? params.fields[0]?.id ?? '',
        fields: params.fields.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          required: f.required ?? false,
          localized: f.localized ?? false,
        })),
      }
    );
    return { id: ct.sys.id, name: ct.name };
  }

  async updateContentType(
    contentTypeId: string,
    params: { name?: string; description?: string; displayField?: string }
  ) {
    const ct = await this.client.contentType.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      contentTypeId,
    });
    const updated = await this.client.contentType.update(
      { spaceId: this.spaceId, environmentId: this.environmentId, contentTypeId },
      { ...ct, ...params }
    );
    return { id: updated.sys.id, name: updated.name };
  }

  async publishContentType(contentTypeId: string) {
    const ct = await this.client.contentType.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      contentTypeId,
    });
    await this.client.contentType.publish(
      { spaceId: this.spaceId, environmentId: this.environmentId, contentTypeId },
      ct
    );
    return { id: contentTypeId, published: true };
  }

  // ── Entries ───────────────────────────────────────────────────────────────

  async searchEntries(params: {
    contentTypeId?: string;
    query?: string;
    limit?: number;
    skip?: number;
    order?: string;
  }) {
    const queryParams: Record<string, string | number> = {
      limit: params.limit ?? 10,
      skip: params.skip ?? 0,
      order: params.order ?? '-sys.updatedAt',
    };
    if (params.contentTypeId) queryParams['content_type'] = params.contentTypeId;
    if (params.query) queryParams['query'] = params.query;

    const result = await this.client.entry.getMany({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      query: queryParams,
    });

    return {
      total: result.total,
      items: result.items.map((e: any) => ({
        id: e.sys.id,
        contentType: e.sys.contentType.sys.id,
        status: getEntryStatus(e),
        updatedAt: e.sys.updatedAt,
        fields: summarizeFields(e.fields),
      })),
    };
  }

  async getEntry(entryId: string) {
    const entry = await this.client.entry.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    return {
      id: entry.sys.id,
      contentType: entry.sys.contentType.sys.id,
      status: getEntryStatus(entry),
      fields: entry.fields,
      updatedAt: entry.sys.updatedAt,
    };
  }

  async createEntry(
    contentTypeId: string,
    fields: Record<string, unknown>,
    defaultLocale: string
  ) {
    const wrappedFields = wrapFieldsWithLocale(fields, defaultLocale);
    const entry = await this.client.entry.create(
      {
        spaceId: this.spaceId,
        environmentId: this.environmentId,
        contentTypeId,
      },
      { fields: wrappedFields }
    );
    return { id: entry.sys.id, contentType: contentTypeId };
  }

  async updateEntry(
    entryId: string,
    fields: Record<string, unknown>,
    defaultLocale: string
  ) {
    const existing = await this.client.entry.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    const wrappedFields = wrapFieldsWithLocale(fields, defaultLocale);
    const updated = await this.client.entry.update(
      { spaceId: this.spaceId, environmentId: this.environmentId, entryId },
      { ...existing, fields: { ...existing.fields, ...wrappedFields } }
    );
    return { id: updated.sys.id };
  }

  async publishEntry(entryId: string) {
    const entry = await this.client.entry.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    await this.client.entry.publish(
      { spaceId: this.spaceId, environmentId: this.environmentId, entryId },
      entry
    );
    return { id: entryId, published: true };
  }

  async unpublishEntry(entryId: string) {
    await this.client.entry.unpublish({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    return { id: entryId, unpublished: true };
  }

  async deleteEntry(entryId: string) {
    await this.client.entry.delete({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    return { id: entryId, deleted: true };
  }

  async archiveEntry(entryId: string) {
    await this.client.entry.archive({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    return { id: entryId, archived: true };
  }

  async unarchiveEntry(entryId: string) {
    await this.client.entry.unarchive({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    return { id: entryId, unarchived: true };
  }

  async updateEntryTags(entryId: string, action: 'add' | 'remove' | 'set', tagIds: string[]) {
    const entry = await this.client.entry.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      entryId,
    });
    const existingTags: any[] = entry.metadata?.tags ?? [];
    let newTags: any[];

    if (action === 'set') {
      newTags = tagIds.map((id) => ({ sys: { type: 'Link', linkType: 'Tag', id } }));
    } else if (action === 'add') {
      const existing = new Set(existingTags.map((t) => t.sys.id));
      newTags = [
        ...existingTags,
        ...tagIds
          .filter((id) => !existing.has(id))
          .map((id) => ({ sys: { type: 'Link', linkType: 'Tag', id } })),
      ];
    } else {
      const toRemove = new Set(tagIds);
      newTags = existingTags.filter((t) => !toRemove.has(t.sys.id));
    }

    const updated = await this.client.entry.update(
      { spaceId: this.spaceId, environmentId: this.environmentId, entryId },
      { ...entry, metadata: { ...(entry.metadata ?? {}), tags: newTags } }
    );
    return { id: updated.sys.id, tags: newTags.map((t) => t.sys.id) };
  }

  // ── Releases ──────────────────────────────────────────────────────────────

  async listReleases(limit = 25, skip = 0) {
    const result = await this.client.release.getMany({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      query: { limit, skip },
    });
    return {
      total: result.total,
      items: result.items.map((r: any) => ({
        id: r.sys.id,
        title: r.title,
        entryCount: r.entities?.items?.length ?? 0,
        createdAt: r.sys.createdAt,
      })),
    };
  }

  async createRelease(title: string) {
    const release = await this.client.release.create(
      { spaceId: this.spaceId, environmentId: this.environmentId },
      { title, entities: { sys: { type: 'Array' }, items: [] } }
    );
    return { id: release.sys.id, title: release.title };
  }

  async addEntriesToRelease(releaseId: string, entryIds: string[]) {
    const release = await this.client.release.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      releaseId,
    });
    const existingIds = new Set((release.entities?.items ?? []).map((e: any) => e.sys.id));
    const newItems = [
      ...(release.entities?.items ?? []),
      ...entryIds
        .filter((id) => !existingIds.has(id))
        .map((id) => ({ sys: { type: 'Link', linkType: 'Entry', id } })),
    ];
    const updated = await this.client.release.update(
      { spaceId: this.spaceId, environmentId: this.environmentId, releaseId },
      { ...release, entities: { sys: { type: 'Array' }, items: newItems } }
    );
    return { id: releaseId, entryCount: updated.entities?.items?.length ?? newItems.length };
  }

  async publishRelease(releaseId: string) {
    const release = await this.client.release.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      releaseId,
    });
    await this.client.release.publish(
      { spaceId: this.spaceId, environmentId: this.environmentId, releaseId },
      release
    );
    return { id: releaseId, published: true };
  }

  // ── Assets ────────────────────────────────────────────────────────────────

  async listAssets(limit = 10, skip = 0) {
    const result = await this.client.asset.getMany({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      query: { limit, skip, order: '-sys.updatedAt' },
    });
    return {
      total: result.total,
      items: result.items.map((a: any) => ({
        id: a.sys.id,
        title: firstLocaleValue(a.fields.title),
        contentType: (firstLocaleValue(a.fields.file) as Record<string, unknown> | undefined)?.contentType,
        updatedAt: a.sys.updatedAt,
      })),
    };
  }

  async getAsset(assetId: string) {
    const asset = await this.client.asset.get({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      assetId,
    });
    return {
      id: asset.sys.id,
      title: firstLocaleValue(asset.fields.title),
      description: firstLocaleValue(asset.fields.description),
      file: firstLocaleValue(asset.fields.file),
      updatedAt: asset.sys.updatedAt,
    };
  }

  // ── Locales ───────────────────────────────────────────────────────────────

  async listLocales() {
    const result = await this.client.locale.getMany({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
    });
    return result.items.map((l: any) => ({
      code: l.code,
      name: l.name,
      default: l.default,
      fallbackCode: l.fallbackCode,
    }));
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  async listTags(limit = 100) {
    const result = await this.client.tag.getMany({
      spaceId: this.spaceId,
      environmentId: this.environmentId,
      query: { limit },
    });
    return result.items.map((t: any) => ({ id: t.sys.id, name: t.name }));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEntryStatus(entry: { sys: { publishedAt?: string; archivedAt?: string } }): string {
  if (entry.sys.archivedAt) return 'archived';
  if (entry.sys.publishedAt) return 'published';
  return 'draft';
}

function summarizeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const [key, localeMap] of Object.entries(fields)) {
    if (localeMap && typeof localeMap === 'object') {
      const values = Object.values(localeMap as Record<string, unknown>);
      summary[key] = values[0];
    }
  }
  return summary;
}

function firstLocaleValue(
  localeMap: Record<string, unknown> | undefined
): unknown {
  if (!localeMap) return undefined;
  return Object.values(localeMap)[0];
}

function wrapFieldsWithLocale(
  fields: Record<string, unknown>,
  defaultLocale: string
): Record<string, Record<string, unknown>> {
  const wrapped: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value as object);
      // Already locale-wrapped if all keys look like locale codes (e.g. "en-US")
      if (keys.length > 0 && keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) {
        wrapped[key] = value as Record<string, unknown>;
        continue;
      }
    }
    wrapped[key] = { [defaultLocale]: value };
  }
  return wrapped;
}
