import { isReference, EntryToCreate } from '@types';

const RICH_TEXT_ENTRY_LINK_NODES = new Set([
  'embedded-entry-block',
  'embedded-entry-inline',
  'entry-hyperlink',
]);

function createEntryLink(entryId: string): {
  sys: { type: 'Link'; linkType: 'Entry'; id: string };
} {
  return {
    sys: {
      type: 'Link',
      linkType: 'Entry',
      id: entryId,
    },
  };
}

function standaloneRefTempId(value: unknown): string | undefined {
  if (isReference(value)) {
    return value.__ref;
  }
  if (typeof value !== 'object' || value === null || !('sys' in value)) {
    return undefined;
  }
  const sys = (value as { sys: unknown }).sys;
  if (typeof sys !== 'object' || sys === null) {
    return undefined;
  }
  const s = sys as Record<string, unknown>;
  if (
    s.type !== 'Link' ||
    s.linkType !== 'Entry' ||
    typeof s.id !== 'string' ||
    s.id.length === 0
  ) {
    return undefined;
  }
  return s.id;
}

function isArrayOfStandaloneRefs(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => standaloneRefTempId(v) !== undefined)
  );
}

/** Non-null plain object (excludes arrays); matches typical Rich Text JSON nodes. */
function isRichTextJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** CMA document or agent payload with a `content` array (often no top-level `nodeType`). */
function hasRichTextTreeShape(value: unknown): boolean {
  if (!isRichTextJsonObject(value)) {
    return false;
  }
  const o = value;
  if (o.nodeType === 'document') {
    return true;
  }
  return Array.isArray(o.content);
}

function richTextEmbeddedEntryTempId(node: Record<string, unknown>): string | undefined {
  if (!RICH_TEXT_ENTRY_LINK_NODES.has(String(node.nodeType)) || !isRichTextJsonObject(node.data)) {
    return undefined;
  }
  const target = node.data.target;
  if (!isRichTextJsonObject(target)) {
    return undefined;
  }
  const sys = target.sys as Record<string, unknown> | undefined;
  if (sys?.type !== 'Link' || sys.linkType !== 'Entry' || typeof sys.id !== 'string') {
    return undefined;
  }
  return sys.id;
}

function richTextHasUnresolvedEntryLink(node: unknown): boolean {
  if (!isRichTextJsonObject(node)) {
    return false;
  }
  const n = node;
  if (richTextEmbeddedEntryTempId(n)) {
    return true;
  }
  if (Array.isArray(n.content)) {
    return (n.content as unknown[]).some((c) => richTextHasUnresolvedEntryLink(c));
  }
  return false;
}

function resolveEntryLinksInRichTextDocument(
  doc: unknown,
  tempIdToEntryId: Map<string, string>
): unknown {
  const walk = (n: unknown): unknown => {
    if (!isRichTextJsonObject(n)) {
      return n;
    }
    const node = n;
    const tempId = richTextEmbeddedEntryTempId(node);

    const mapChildren = (): unknown =>
      Array.isArray(node.content)
        ? { ...node, content: (node.content as unknown[]).map(walk) }
        : node;

    if (tempId) {
      const entryId = lookupTempId(tempId, tempIdToEntryId);
      if (entryId) {
        const data = { ...(node.data as Record<string, unknown>) };
        const target = data.target as Record<string, unknown>;
        const t = { ...target };
        const sys = { ...(t.sys as Record<string, unknown>), id: entryId };
        t.sys = sys;
        data.target = t;
        return {
          ...node,
          data,
          content: Array.isArray(node.content)
            ? (node.content as unknown[]).map(walk)
            : node.content,
        };
      }
    }

    return mapChildren();
  };

  return walk(doc);
}

function lookupTempId(tempId: string, tempIdToEntryId: Map<string, string>): string | undefined {
  const exact = tempIdToEntryId.get(tempId);
  if (exact) {
    return exact;
  }
  const lower = tempId.toLowerCase();
  for (const [key, value] of tempIdToEntryId.entries()) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return undefined;
}

function valueHasReferences(value: unknown): boolean {
  if (standaloneRefTempId(value) !== undefined) {
    return true;
  }
  if (isArrayOfStandaloneRefs(value)) {
    return true;
  }
  if (hasRichTextTreeShape(value)) {
    return richTextHasUnresolvedEntryLink(value);
  }
  return false;
}

export function entryHasReferences(entry: EntryToCreate): boolean {
  for (const localizedValue of Object.values(entry.fields)) {
    for (const value of Object.values(localizedValue)) {
      if (valueHasReferences(value)) {
        return true;
      }
    }
  }
  return false;
}

export function separateReferenceFields(fields: Record<string, Record<string, unknown>>): {
  nonRefFields: Record<string, Record<string, unknown>>;
  refFields: Record<string, Record<string, unknown>>;
} {
  const nonRefFields: Record<string, Record<string, unknown>> = {};
  const refFields: Record<string, Record<string, unknown>> = {};

  for (const [fieldId, localizedValue] of Object.entries(fields)) {
    const nonRefLocalized: Record<string, unknown> = {};
    const refLocalized: Record<string, unknown> = {};

    for (const [locale, value] of Object.entries(localizedValue)) {
      if (valueHasReferences(value)) {
        refLocalized[locale] = value;
      } else {
        nonRefLocalized[locale] = value;
      }
    }

    if (Object.keys(nonRefLocalized).length > 0) {
      nonRefFields[fieldId] = nonRefLocalized;
    }
    if (Object.keys(refLocalized).length > 0) {
      refFields[fieldId] = refLocalized;
    }
  }

  return { nonRefFields, refFields };
}

export function resolveReferences(
  fields: Record<string, Record<string, unknown>>,
  tempIdToEntryId: Map<string, string>
): Record<string, Record<string, unknown>> {
  const resolved: Record<string, Record<string, unknown>> = {};

  for (const [fieldId, localizedValue] of Object.entries(fields)) {
    const resolvedLocalized: Record<string, unknown> = {};

    for (const [locale, value] of Object.entries(localizedValue)) {
      const tempId = standaloneRefTempId(value);

      if (tempId !== undefined && !hasRichTextTreeShape(value)) {
        const entryId = lookupTempId(tempId, tempIdToEntryId);
        if (entryId) {
          resolvedLocalized[locale] = createEntryLink(entryId);
        }
      } else if (isArrayOfStandaloneRefs(value)) {
        const resolvedRefs = value
          .map((item) => {
            const id = standaloneRefTempId(item)!;
            const entryId = lookupTempId(id, tempIdToEntryId);
            return entryId ? createEntryLink(entryId) : null;
          })
          .filter((link): link is NonNullable<typeof link> => link !== null);

        if (resolvedRefs.length > 0) {
          resolvedLocalized[locale] = resolvedRefs;
        }
      } else if (hasRichTextTreeShape(value)) {
        resolvedLocalized[locale] = resolveEntryLinksInRichTextDocument(value, tempIdToEntryId);
      } else {
        resolvedLocalized[locale] = value;
      }
    }

    if (Object.keys(resolvedLocalized).length > 0) {
      resolved[fieldId] = resolvedLocalized;
    }
  }

  return resolved;
}
