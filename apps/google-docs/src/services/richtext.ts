/**
 * Rich Text helpers for Document Parser Agent output.
 * The agent returns Contentful-shaped JSON (document tree), not Markdown.
 */

export type ContentfulRichTextDocument = {
  nodeType: 'document';
  data: Record<string, unknown>;
  content: unknown[];
};

const ASSET_LINK_NODE_TYPES = new Set([
  'embedded-asset-block',
  'embedded-asset-inline',
  'asset-hyperlink',
]);

function emptyRichTextDocument(): ContentfulRichTextDocument {
  return {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: 'paragraph',
        data: {},
        content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
      },
    ],
  };
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseJsonValue(value: string): unknown {
  try {
    return JSON.parse(value.trim()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Coerce agent output to a plain object: JSON string or already-parsed object.
 */
function coerceRichTextPayload(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    const parsed = parseJsonValue(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function resolveAssetPlaceholdersInNodes(
  nodes: unknown[],
  assetIdMap: Record<string, string>
): unknown[] {
  return nodes.map((node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return node;
    }
    const n = node as Record<string, unknown>;
    const nodeType = n.nodeType;

    if (
      typeof nodeType === 'string' &&
      ASSET_LINK_NODE_TYPES.has(nodeType) &&
      n.data &&
      typeof n.data === 'object' &&
      !Array.isArray(n.data)
    ) {
      const data = n.data as Record<string, unknown>;
      const target = data.target;
      if (target && typeof target === 'object' && !Array.isArray(target)) {
        const sys = (target as Record<string, unknown>).sys as Record<string, unknown> | undefined;
        if (sys && sys.type === 'Link' && sys.linkType === 'Asset' && typeof sys.id === 'string') {
          const realId = assetIdMap[sys.id];
          if (realId) {
            return {
              ...n,
              data: {
                ...data,
                target: {
                  ...(target as Record<string, unknown>),
                  sys: { ...sys, id: realId },
                },
              },
              content: Array.isArray(n.content)
                ? resolveAssetPlaceholdersInNodes(n.content as unknown[], assetIdMap)
                : n.content,
            };
          }
        }
      }
    }

    if (Array.isArray(n.content)) {
      return {
        ...n,
        content: resolveAssetPlaceholdersInNodes(n.content as unknown[], assetIdMap),
      };
    }

    return n;
  });
}

/**
 * Normalizes agent Rich Text JSON into a Contentful document and resolves
 * embedded asset placeholder ids (e.g. img-0) using the map from asset creation.
 */
export function normalizeAgentRichTextJson(
  value: unknown,
  assetIdMap?: Record<string, string>
): ContentfulRichTextDocument {
  const payload = coerceRichTextPayload(value);
  if (!payload) {
    return emptyRichTextDocument();
  }

  const rawContent = payload.content;
  const contentArray = Array.isArray(rawContent) ? (rawContent as unknown[]) : [];

  let doc: ContentfulRichTextDocument =
    payload.nodeType === 'document'
      ? {
          nodeType: 'document',
          data:
            payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
              ? (payload.data as Record<string, unknown>)
              : {},
          content: contentArray,
        }
      : {
          nodeType: 'document',
          data:
            payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
              ? (payload.data as Record<string, unknown>)
              : {},
          content: contentArray,
        };

  doc = deepClone(doc);

  if (assetIdMap && Object.keys(assetIdMap).length > 0) {
    doc = {
      ...doc,
      content: resolveAssetPlaceholdersInNodes(doc.content, assetIdMap),
    };
  }

  if (!doc.content.length) {
    return emptyRichTextDocument();
  }

  return doc;
}
