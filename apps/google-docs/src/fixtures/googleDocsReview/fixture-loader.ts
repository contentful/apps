import { GoogleDocsReviewFixture } from './types';

const fixtureModules = import.meta.glob('./fixture.json', { eager: true }) as Record<
  string,
  { default: unknown }
>;

const hasRequiredShape = (value: unknown): value is GoogleDocsReviewFixture => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.entries) &&
    Array.isArray(candidate.assets) &&
    !!candidate.originalNormalizedDocument &&
    typeof candidate.originalNormalizedDocument === 'object' &&
    !!candidate.editableNormalizedDocument &&
    typeof candidate.editableNormalizedDocument === 'object' &&
    !!candidate.entryBlockGraph &&
    typeof candidate.entryBlockGraph === 'object'
  );
};

export const loadGoogleDocsReviewFixture = (): GoogleDocsReviewFixture | null => {
  const module = fixtureModules['./fixture.json'];
  if (!module) {
    return null;
  }

  return hasRequiredShape(module.default) ? module.default : null;
};
