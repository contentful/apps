import type { MappingReviewSuspendPayload } from '@types';

type FixtureReviewPayloadModule =
  | MappingReviewSuspendPayload
  | {
      default: MappingReviewSuspendPayload;
    };

type FixtureReviewPayloadImporter = () => Promise<FixtureReviewPayloadModule>;

export async function resolveFixtureReviewPayload(
  importers: Record<string, FixtureReviewPayloadImporter>
): Promise<MappingReviewSuspendPayload | null> {
  const importer = Object.values(importers)[0];

  if (!importer) {
    return null;
  }

  const module = await importer();

  if ('default' in module) {
    return module.default;
  }

  return module;
}

export async function loadFixtureReviewPayload(): Promise<MappingReviewSuspendPayload | null> {
  return resolveFixtureReviewPayload(
    import.meta.glob<FixtureReviewPayloadModule>('./fixture.json')
  );
}
