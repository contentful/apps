/** Rich Text: accept only CMA-shaped documents; resolve asset placeholder ids after upload. */

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

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value.trim()) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeDocumentData(data: unknown): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
}

/** Requires `nodeType: "document"` and a `content` array; invalid or missing `data` is normalized to `{}`. */
function parseRichTextDocument(value: unknown): ContentfulRichTextDocument | null {
  let richTextObject: Record<string, unknown> | null = null;

  if (typeof value === 'string') {
    richTextObject = parseJsonObject(value);
  } else {
    richTextObject = value as Record<string, unknown>;
  }

  if (
    !richTextObject ||
    richTextObject.nodeType !== 'document' ||
    !Array.isArray(richTextObject.content)
  ) {
    return null;
  }

  return {
    nodeType: richTextObject.nodeType,
    data: normalizeDocumentData(richTextObject.data),
    content: richTextObject.content as unknown[],
  };
}

function resolveAssetPlaceholdersInNodes(
  nodes: unknown[],
  assetIdMap: Record<string, string>
): unknown[] {
  return nodes.map((n) => {
    if (!n || typeof n !== 'object' || Array.isArray(n)) {
      return n;
    }
    const node = n as Record<string, unknown>;
    const nodeType = node.nodeType;

    if (
      typeof nodeType === 'string' &&
      ASSET_LINK_NODE_TYPES.has(nodeType) &&
      node.data &&
      typeof node.data === 'object' &&
      !Array.isArray(node.data)
    ) {
      const data = node.data as Record<string, unknown>;
      const target = data.target;
      if (target && typeof target === 'object' && !Array.isArray(target)) {
        const sys = (target as Record<string, unknown>).sys as Record<string, unknown> | undefined;
        if (sys && sys.type === 'Link' && sys.linkType === 'Asset' && typeof sys.id === 'string') {
          const realId = assetIdMap[sys.id];
          if (realId) {
            return {
              ...node,
              data: {
                ...data,
                target: {
                  ...(target as Record<string, unknown>),
                  sys: { ...sys, id: realId },
                },
              },
              content: Array.isArray(node.content)
                ? resolveAssetPlaceholdersInNodes(node.content as unknown[], assetIdMap)
                : node.content,
            };
          }
        }
      }
    }

    if (Array.isArray(node.content)) {
      return {
        ...node,
        content: resolveAssetPlaceholdersInNodes(node.content as unknown[], assetIdMap),
      };
    }

    return node;
  });
}

export function normalizeAgentRichTextJson(
  value: unknown,
  assetIdMap?: Record<string, string>
): ContentfulRichTextDocument {
  const doc = parseRichTextDocument(value);
  if (!doc || !doc.content.length) {
    return emptyRichTextDocument();
  }

  const needsPlaceholderResolution = assetIdMap !== undefined && Object.keys(assetIdMap).length > 0;

  if (!needsPlaceholderResolution) {
    return doc;
  }

  const cloned = deepClone(doc);
  const out = {
    ...cloned,
    content: resolveAssetPlaceholdersInNodes(cloned.content, assetIdMap),
  };

  if (!out.content.length) {
    return emptyRichTextDocument();
  }

  return out;
}
