import { CMAClient, ContentTypeField } from '@contentful/app-sdk';
import { AdoptedFieldsMap, ReferencedEntryData } from './adoptedFields';
import { isEntryArrayField, isEntryField, isLinkArray, isLinkValue } from './fieldTypes';
import { EntryProps, ContentTypeProps } from 'contentful-management';

export interface UpdateResult {
  fieldsUpdated: number;
  entriesUpdated: number;
  entryId: string;
  errors?: string[];
}

async function updateSingleEntry(
  cma: CMAClient,
  entryId: string,
  sourceLocale: string,
  targetLocales: string[],
  adoptedFields: Record<string, boolean>
): Promise<{ fieldsUpdated: number; success: boolean; error?: string }> {
  try {
    const entry = await cma.entry.get({ entryId });

    let fieldsUpdated = 0;

    for (const [fieldId, isAdopted] of Object.entries(adoptedFields)) {
      if (!isAdopted) {
        continue;
      }

      const sourceValue = entry.fields[fieldId]?.[sourceLocale];

      for (const targetLocale of targetLocales) {
        if (!entry.fields[fieldId]) {
          entry.fields[fieldId] = {};
        }
        entry.fields[fieldId][targetLocale] = sourceValue;
      }

      fieldsUpdated++;
    }

    if (fieldsUpdated > 0) {
      await cma.entry.update({ entryId }, entry);
    }

    return { fieldsUpdated, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error updating entry';
    return { fieldsUpdated: 0, success: false, error: errorMessage };
  }
}

export async function updateEntries(
  cma: CMAClient,
  mainEntryId: string,
  sourceLocale: string,
  targetLocales: string[],
  adoptedFields: AdoptedFieldsMap
): Promise<UpdateResult> {
  let totalFieldsUpdated = 0;
  let entriesUpdated = 0;
  const errors: string[] = [];

  for (const [entryId, entryAdoptedFields] of Object.entries(adoptedFields)) {
    const hasAdoptedFields = Object.values(entryAdoptedFields).some((adopted) => adopted);
    if (!hasAdoptedFields) {
      continue;
    }

    const result = await updateSingleEntry(
      cma,
      entryId,
      sourceLocale,
      targetLocales,
      entryAdoptedFields
    );

    if (result.success) {
      totalFieldsUpdated += result.fieldsUpdated;
      if (result.fieldsUpdated > 0) {
        entriesUpdated++;
      }
    } else if (result.error) {
      errors.push(`Entry ${entryId}: ${result.error}`);
    }
  }

  if (errors.length > 0) {
    return {
      fieldsUpdated: totalFieldsUpdated,
      entriesUpdated,
      entryId: mainEntryId,
      errors,
    };
  }

  return {
    fieldsUpdated: totalFieldsUpdated,
    entriesUpdated,
    entryId: mainEntryId,
  };
}

export const fetchEntries = async (
  cma: CMAClient,
  entryId: string,
  contentTypeId: string
): Promise<{
  entry: EntryProps;
  contentType: ContentTypeProps;
  referencedEntriesData: ReferencedEntryData[];
}> => {
  const [mainEntry, mainEntryContentType] = await Promise.all([
    cma.entry.get({ entryId }),
    cma.contentType.get({ contentTypeId }),
  ]);

  const referenceFields = (mainEntryContentType.fields as ContentTypeField[]).filter(
    (field) => isEntryField(field) || isEntryArrayField(field)
  );

  const referencedEntriesData: ReferencedEntryData[] = [];
  const contentTypeCache: Record<string, ContentTypeProps> = {
    [contentTypeId]: mainEntryContentType,
  };
  const seenReferences = new Set<string>();

  const processReference = async (referenceEntryId: string, field: ContentTypeField) => {
    const refKey = `${referenceEntryId}:${field.id}`;
    if (seenReferences.has(refKey)) return;
    seenReferences.add(refKey);

    if (referenceEntryId === entryId) {
      referencedEntriesData.push({
        entry: mainEntry,
        contentType: mainEntryContentType,
        fieldId: field.id,
        fieldName: field.name,
        isSelfReference: true,
      });
    } else {
      const referenceEntry = await cma.entry.get({ entryId: referenceEntryId });
      const referenceContentTypeId = referenceEntry.sys.contentType.sys.id;

      let referenceContentType = contentTypeCache[referenceContentTypeId];
      if (!referenceContentType) {
        referenceContentType = await cma.contentType.get({
          contentTypeId: referenceContentTypeId,
        });
        contentTypeCache[referenceContentTypeId] = referenceContentType;
      }

      referencedEntriesData.push({
        entry: referenceEntry,
        contentType: referenceContentType,
        fieldId: field.id,
        fieldName: field.name,
        isSelfReference: false,
      });
    }
  };

  for (const field of referenceFields) {
    const fieldValues = mainEntry.fields[field.id];
    if (!fieldValues) continue;

    const value = Object.values(fieldValues)[0];

    if (isLinkValue(value) && value.sys.linkType === 'Entry') {
      await processReference(value.sys.id, field);
    } else if (isLinkArray(value)) {
      for (const link of value) {
        if (link.sys.linkType === 'Entry') {
          await processReference(link.sys.id, field);
        }
      }
    }
  }

  return {
    entry: mainEntry,
    contentType: mainEntryContentType,
    referencedEntriesData,
  };
};
