import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
  AppActionResponse,
} from '@contentful/node-apps-toolkit';
import type { WithStorage } from './types/storage';
import { setEntryKlaviyoFieldMappings } from '../src/utils/field-mappings-legacy';

interface FieldMappingInput {
  contentTypeId?: string;
  contentfulFieldId: string;
  klaviyoBlockName: string;
  fieldType?: string;
  locale?: string;
  isAssetField?: boolean;
}

interface SetFieldMappingsParams {
  entryId?: string;
  mappings: FieldMappingInput[];
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', SetFieldMappingsParams>,
  context: WithStorage<FunctionEventContext>
): Promise<AppActionResponse> => {
  const entryId = event.body.entryId ?? '';
  const mappings = event.body.mappings ?? [];

  if (context.storage) {
    // Replace semantics, matching the legacy fallback below: clear this
    // entry's mappings, then write the new set. update/delete both require
    // a non-empty `where`, per the RFC's rejection of unconditional
    // mutations.
    await context.storage.delete({
      table: 'field_mappings',
      where: [{ column: 'entry_id', op: 'eq', value: entryId }],
    });

    if (mappings.length) {
      await context.storage.insert({
        into: 'field_mappings',
        rows: mappings.map((mapping) => ({
          entry_id: entryId,
          content_type_id: mapping.contentTypeId ?? null,
          contentful_field_id: mapping.contentfulFieldId,
          klaviyo_block_name: mapping.klaviyoBlockName,
          field_type: mapping.fieldType ?? null,
          locale: mapping.locale ?? null,
          is_asset_field: mapping.isAssetField ?? null,
        })),
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  // Fallback: context.storage doesn't exist on the platform yet (PIC-1321).
  // Reuse the legacy klaviyoFieldMappings CMA-entry write path so this
  // action keeps working until storage ships; delete this branch once it does.
  await setEntryKlaviyoFieldMappings(
    context.cma,
    entryId,
    mappings,
    context.spaceId,
    context.environmentId
  );
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
