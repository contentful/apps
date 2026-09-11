import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
  AppActionResponse,
} from '@contentful/node-apps-toolkit';
import type { WithStorage } from './types/storage';
import {
  getAllKlaviyoFieldMappings,
  getEntryKlaviyoFieldMappings,
} from '../src/utils/field-mappings-legacy';

interface GetFieldMappingsParams {
  entryId?: string;
}

interface FieldMappingRow {
  entry_id: string;
  content_type_id: string | null;
  contentful_field_id: string;
  klaviyo_block_name: string;
  field_type: string | null;
  locale: string | null;
  is_asset_field: boolean | null;
}

// Legacy mapping objects use camelCase keys, and older ones fall back to
// aliases (`id`, `name`, `type`) instead of the canonical field names — see
// the same fallback logic in entrySyncFunction.ts.
function toStorageRow(mapping: any): FieldMappingRow | null {
  const contentfulFieldId = mapping.contentfulFieldId || mapping.id;
  const klaviyoBlockName = mapping.klaviyoBlockName || mapping.name || contentfulFieldId;
  if (!contentfulFieldId || !klaviyoBlockName) return null;
  return {
    entry_id: mapping.entryId ?? '',
    content_type_id: mapping.contentTypeId ?? null,
    contentful_field_id: contentfulFieldId,
    klaviyo_block_name: klaviyoBlockName,
    field_type: mapping.fieldType || mapping.type || null,
    locale: mapping.locale ?? null,
    is_asset_field: mapping.isAssetField ?? null,
  };
}

// One-time bulk backfill: the legacy klaviyoFieldMappings CMA entry holds
// every entry's mappings in a single JSON array, so migrating it into
// context.storage is a single read + single insert, not per-entry. Gated on
// "does this scope's field_mappings table have any row at all" so it only
// runs once per installation. Known gap: if a write lands via
// setFieldMappings before this ever runs, the table is no longer empty and
// the bulk backfill is skipped — in practice every UI surface reads before
// it lets a user save, so this window is narrow. Delete this whole function
// once every installation has been migrated.
async function migrateLegacyMappingsIfNeeded(
  context: WithStorage<FunctionEventContext>
): Promise<void> {
  const storage = context.storage!;
  const existing = await storage.query({ from: 'field_mappings', limit: 1 });
  if (existing.rows.length > 0) return;

  const legacyMappings = await getAllKlaviyoFieldMappings(
    context.cma,
    context.spaceId,
    context.environmentId
  );
  const rows = legacyMappings.map(toStorageRow).filter((row): row is FieldMappingRow => row !== null);
  if (rows.length) {
    await storage.insert({ into: 'field_mappings', rows });
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', GetFieldMappingsParams>,
  context: WithStorage<FunctionEventContext>
): Promise<AppActionResponse> => {
  // '' is a real sentinel here (not "no filter") — it's how default,
  // content-type-level mappings are keyed, matching the legacy fallback's
  // entryId semantics below.
  const entryId = event.body.entryId ?? '';

  if (context.storage) {
    await migrateLegacyMappingsIfNeeded(context);

    const result = await context.storage.query<FieldMappingRow>({
      from: 'field_mappings',
      where: [{ column: 'entry_id', op: 'eq', value: entryId }],
      limit: 500,
    });
    return { statusCode: 200, body: JSON.stringify({ mappings: result.rows }) };
  }

  // Fallback: context.storage doesn't exist on the platform yet (PIC-1321).
  // Reuse the legacy klaviyoFieldMappings CMA-entry lookup so this action
  // keeps working until storage ships; delete this branch once it does.
  const mappings = await getEntryKlaviyoFieldMappings(
    context.cma,
    entryId,
    context.spaceId,
    context.environmentId
  );
  return { statusCode: 200, body: JSON.stringify({ mappings }) };
};
