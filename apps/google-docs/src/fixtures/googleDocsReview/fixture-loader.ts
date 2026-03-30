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
    !!candidate.normalizedDocument &&
    typeof candidate.normalizedDocument === 'object' &&
    !!candidate.mappingPlan &&
    typeof candidate.mappingPlan === 'object'
  );
};

export const loadGoogleDocsReviewFixture = (): GoogleDocsReviewFixture | null => {
  const module = fixtureModules['./fixture.json'];
  if (!module) {
    return null;
  }

  return hasRequiredShape(module.default) ? module.default : null;
};
