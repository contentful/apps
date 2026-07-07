import type { MappingReviewSuspendPayload } from '@types';

// This file is temporary to load a mapping suspend payload from the fixture.json file to speed up development.
// TODO: remove this file before launch
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
