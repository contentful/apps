import {
  type ReviewAsset,
  type ReviewEntryBlockGraph,
  type ReviewNormalizedDocument,
  type GoogleDocsReviewData,
} from './types';

const FIXTURE_LOG_PREFIX = '[google-docs][fixture]';

const fixtureModules = import.meta.glob('./*.json', { eager: true }) as Record<
  string,
  { default: unknown }
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNormalizedDocumentLike(value: unknown): value is ReviewNormalizedDocument {
  return isRecord(value) && Array.isArray(value.contentBlocks) && Array.isArray(value.tables);
}

function isEntryBlockGraphLike(value: unknown): value is ReviewEntryBlockGraph {
  return isRecord(value) && Array.isArray(value.entries) && Array.isArray(value.excludedSourceRefs);
}

function hasReviewFixtureShape(value: unknown): value is GoogleDocsReviewData {
  return (
    isRecord(value) &&
    Array.isArray(value.entries) &&
    Array.isArray(value.assets) &&
    isNormalizedDocumentLike(value.originalNormalizedDocument) &&
    isNormalizedDocumentLike(value.editableNormalizedDocument) &&
    isEntryBlockGraphLike(value.entryBlockGraph)
  );
}

function hasNormalizedDocumentPayloadShape(value: unknown): value is {
  normalizedDocument: ReviewNormalizedDocument;
  entryBlockGraph: ReviewEntryBlockGraph;
  contentTypes?: Array<Record<string, unknown>>;
  assets?: ReviewAsset[];
  cmaAssets?: ReviewAsset[];
  referenceGraph?: GoogleDocsReviewData['referenceGraph'];
} {
  return (
    isRecord(value) &&
    isNormalizedDocumentLike(value.normalizedDocument) &&
    isEntryBlockGraphLike(value.entryBlockGraph)
  );
}

function buildEntriesFromEntryBlockGraph(
  entryBlockGraph: ReviewEntryBlockGraph,
  contentTypes: Array<Record<string, unknown>> = []
): GoogleDocsReviewData['entries'] {
  const contentTypeNameById = new Map<string, string>();

  contentTypes.forEach((contentType) => {
    const sys = isRecord(contentType.sys) ? contentType.sys : null;
    const contentTypeId = typeof sys?.id === 'string' ? sys.id : null;
    const contentTypeName = typeof contentType.name === 'string' ? contentType.name : null;

    if (contentTypeId && contentTypeName) {
      contentTypeNameById.set(contentTypeId, contentTypeName);
    }
  });

  return entryBlockGraph.entries.map((entry, index) => ({
    tempId: entry.tempId,
    contentTypeId: entry.contentTypeId,
    fields: {
      title: {
        'en-US':
          contentTypeNameById.get(entry.contentTypeId) ??
          entry.tempId ??
          `${entry.contentTypeId}-${index + 1}`,
      },
    },
  }));
}

export function coerceGoogleDocsReviewData(value: unknown): GoogleDocsReviewData | null {
  if (hasReviewFixtureShape(value)) {
    return value;
  }

  if (hasNormalizedDocumentPayloadShape(value)) {
    const assets = Array.isArray(value.assets)
      ? value.assets
      : Array.isArray(value.cmaAssets)
      ? value.cmaAssets
      : [];

    return {
      entries: buildEntriesFromEntryBlockGraph(value.entryBlockGraph, value.contentTypes ?? []),
      assets,
      referenceGraph: isRecord(value.referenceGraph) ? value.referenceGraph : undefined,
      originalNormalizedDocument: value.normalizedDocument,
      editableNormalizedDocument: structuredClone(value.normalizedDocument),
      entryBlockGraph: value.entryBlockGraph,
    };
  }

  return null;
}

export const loadGoogleDocsReviewData = (): GoogleDocsReviewData | null => {
  const availableFixtureFiles = Object.keys(fixtureModules)
    .map((path) => path.replace('./', ''))
    .sort();

  console.info(FIXTURE_LOG_PREFIX, 'Attempting to load review fixture.', {
    requestedFile: 'fixture.json',
    availableFixtureFiles,
  });

  const module = fixtureModules['./fixture.json'];
  if (!module) {
    console.warn(
      FIXTURE_LOG_PREFIX,
      'Unable to find fixture.json. Add src/fixtures/googleDocsReview/fixture.json or rename the fixture you want to load.'
    );
    return null;
  }

  const fixture = coerceGoogleDocsReviewData(module.default);
  if (!fixture) {
    console.warn(
      FIXTURE_LOG_PREFIX,
      'fixture.json was found but does not match a supported Google Docs review fixture shape.',
      {
        topLevelKeys:
          module.default && typeof module.default === 'object'
            ? Object.keys(module.default as Record<string, unknown>).sort()
            : [],
      }
    );
    return null;
  }

  const variant = hasReviewFixtureShape(module.default)
    ? 'review-fixture'
    : hasNormalizedDocumentPayloadShape(module.default)
    ? 'normalized-document-payload'
    : 'unknown';

  console.info(FIXTURE_LOG_PREFIX, 'Review fixture loaded successfully.', {
    variant,
    entries: fixture.entries.length,
    assets: fixture.assets.length,
    contentBlocks: fixture.originalNormalizedDocument.contentBlocks.length,
    tables: fixture.originalNormalizedDocument.tables.length,
  });

  return fixture;
};
