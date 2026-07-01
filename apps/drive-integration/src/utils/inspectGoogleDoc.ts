import { WorkflowRunError, WorkflowFailureReason } from '@types';

export interface DocumentScopeConfig {
  tabs: Array<{ id: string; title: string; index: number }>;
  imageCount: number;
}

// Internal Google Docs API shapes — only the fields we inspect
type Tab = {
  childTabs?: Tab[];
  documentTab?: {
    inlineObjects?: Record<string, unknown>;
    positionedObjects?: Record<string, unknown>;
  };
  tabProperties?: {
    tabId?: string;
    title?: string;
    index?: number;
    nestingLevel?: number;
  };
};

type GoogleDocument = {
  tabs?: Tab[];
  inlineObjects?: Record<string, unknown>;
  positionedObjects?: Record<string, unknown>;
};

type GoogleDocsErrorBody = {
  error?: { code?: number; status?: string };
};

function tabIndexWithinParent(tab: Tab): number {
  return tab.tabProperties?.index ?? 0;
}

function tabNestingLevel(tab: Tab): number {
  return tab.tabProperties?.nestingLevel ?? 0;
}

function compareTabsForSiblingOrder(a: Tab, b: Tab): number {
  const byLevel = tabNestingLevel(a) - tabNestingLevel(b);
  if (byLevel !== 0) return byLevel;
  return tabIndexWithinParent(a) - tabIndexWithinParent(b);
}

function flattenTabs(tabs: Tab[] | undefined): Tab[] {
  if (!tabs || tabs.length === 0) return [];
  return [...tabs]
    .sort(compareTabsForSiblingOrder)
    .flatMap((tab) => [tab, ...flattenTabs(tab.childTabs)]);
}

function countObjects(value: Record<string, unknown> | undefined): number {
  return value ? Object.keys(value).length : 0;
}

function getDocumentScope(rawDocJson: unknown): DocumentScopeConfig {
  const rawDoc = (rawDocJson ?? {}) as GoogleDocument;
  const flattenedTabs = flattenTabs(rawDoc.tabs);

  const tabs = flattenedTabs.map((tab, index) => ({
    id: tab.tabProperties?.tabId ?? `tab-${index + 1}`,
    title: tab.tabProperties?.title?.trim() || `Tab ${index + 1}`,
    index,
  }));

  let imageCount: number;
  if (flattenedTabs.length > 0) {
    imageCount = flattenedTabs.reduce(
      (count, tab) =>
        count +
        countObjects(tab.documentTab?.inlineObjects) +
        countObjects(tab.documentTab?.positionedObjects),
      0
    );
  } else {
    imageCount = countObjects(rawDoc.inlineObjects) + countObjects(rawDoc.positionedObjects);
  }

  return { tabs, imageCount };
}

function classifyAuthFailure(status: number, body: GoogleDocsErrorBody): boolean {
  if (status !== 401) return false;
  return body?.error?.status === 'UNAUTHENTICATED';
}

/**
 * Fetches a Google Doc directly from the browser and returns the scope config
 * needed for the pre-flight tab/image selection UI.
 *
 * @throws {WorkflowRunError} On auth failure, 404, or any non-OK response.
 */
export async function fetchDocumentScope(
  documentId: string,
  oauthToken: string
): Promise<DocumentScopeConfig> {
  const url = `https://docs.googleapis.com/v1/documents/${documentId}?includeTabsContent=true`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${oauthToken}` },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as GoogleDocsErrorBody;

    if (classifyAuthFailure(response.status, body)) {
      throw new WorkflowRunError(
        'Google Drive connection expired or is no longer valid.',
        WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED
      );
    }

    if (response.status === 404 || body?.error?.status === 'PERMISSION_DENIED') {
      throw new WorkflowRunError(
        'Google Doc not found. Make sure the document exists and your Google account has access to it.',
        WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND
      );
    }

    throw new WorkflowRunError(
      `Failed to fetch Google Doc: ${response.status} ${response.statusText}`,
      WorkflowFailureReason.GENERIC
    );
  }

  const rawDocJson = await response.json();
  return getDocumentScope(rawDocJson);
}
