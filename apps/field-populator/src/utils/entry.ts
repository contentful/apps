import { CMAClient, ContentTypeField } from '@contentful/app-sdk';
import { AdoptedFieldsMap, ReferencedEntryData } from './adoptedFields';
import { isEntryArrayField, isEntryField, isLinkArray, isLinkValue, LinkValue } from './fieldTypes';
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
  const entriesToUpdate = Object.entries(adoptedFields).filter(([, entryAdoptedFields]) =>
    Object.values(entryAdoptedFields).some((adopted) => adopted)
  );

  const results = await Promise.all(
    entriesToUpdate.map(([entryId, entryAdoptedFields]) =>
      updateSingleEntry(cma, entryId, sourceLocale, targetLocales, entryAdoptedFields)
    )
  );

  let totalFieldsUpdated = 0;
  let entriesUpdated = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.success) {
      totalFieldsUpdated += result.fieldsUpdated;
      if (result.fieldsUpdated > 0) {
        entriesUpdated++;
      }
    } else if (result.error) {
      errors.push(`Entry ${entriesToUpdate[index][0]}: ${result.error}`);
    }
  });

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

  const referencesToProcess: { referenceEntryId: string; field: ContentTypeField }[] =
    collectReferences(mainEntry, mainEntryContentType);

  const entryMap = await fetchReferenceEntries(cma, referencesToProcess, entryId);

  const contentTypeMap = await fetchContentTypes(
    cma,
    entryMap,
    contentTypeId,
    mainEntryContentType
  );

  const referencedEntriesData: ReferencedEntryData[] = referencesToProcess.map(
    ({ referenceEntryId, field }) => {
      if (referenceEntryId === entryId) {
        return {
          entry: mainEntry,
          contentType: mainEntryContentType,
          fieldId: field.id,
          fieldName: field.name,
          isSelfReference: true,
        };
      }

      const referenceEntry = entryMap[referenceEntryId];
      const referenceContentType = contentTypeMap[referenceEntry.sys.contentType.sys.id];

      return {
        entry: referenceEntry,
        contentType: referenceContentType,
        fieldId: field.id,
        fieldName: field.name,
        isSelfReference: false,
      };
    }
  );

  return {
    entry: mainEntry,
    contentType: mainEntryContentType,
    referencedEntriesData,
  };
};

const collectReferences = (mainEntry: EntryProps, mainEntryContentType: ContentTypeProps) => {
  const referenceFields = mainEntryContentType.fields.filter(
    (field) => isEntryField(field) || isEntryArrayField(field)
  );

  const seenReferences = new Set<string>();
  const referencesToProcess: { referenceEntryId: string; field: ContentTypeField }[] = [];

  const processReference = (link: LinkValue, field: ContentTypeField) => {
    const referenceKey = `${link.sys.id}:${field.id}`;
    if (!seenReferences.has(referenceKey)) {
      seenReferences.add(referenceKey);
      referencesToProcess.push({ referenceEntryId: link.sys.id, field });
    }
  };

  for (const field of referenceFields) {
    const fieldValues = mainEntry.fields[field.id];
    if (!fieldValues) continue;

    const value = Object.values(fieldValues)[0];

    if (isLinkValue(value) && value.sys.linkType === 'Entry') {
      processReference(value, field);
    } else if (isLinkArray(value)) {
      for (const link of value) {
        if (link.sys.linkType === 'Entry') {
          processReference(link, field);
        }
      }
    }
  }

  return referencesToProcess;
};

const fetchReferenceEntries = async (
  cma: CMAClient,
  referencesToProcess: { referenceEntryId: string; field: ContentTypeField }[],
  entryId: string
): Promise<Record<string, EntryProps>> => {
  const uniqueEntryIds = [
    ...new Set(
      referencesToProcess
        .map((reference) => reference.referenceEntryId)
        .filter((id) => id !== entryId)
    ),
  ];

  const entryMap: Record<string, EntryProps> = {};

  if (uniqueEntryIds.length > 0) {
    const entriesResponse = await cma.entry.getMany({
      query: { 'sys.id[in]': uniqueEntryIds.join(',') },
    });
    for (const fetchedEntry of entriesResponse.items) {
      entryMap[fetchedEntry.sys.id] = fetchedEntry;
    }
  }

  return entryMap;
};

const fetchContentTypes = async (
  cma: CMAClient,
  entryMap: Record<string, EntryProps>,
  contentTypeId: string,
  mainEntryContentType: ContentTypeProps
): Promise<Record<string, ContentTypeProps>> => {
  const contentTypeMap: Record<string, ContentTypeProps> = {
    [contentTypeId]: mainEntryContentType,
  };

  const uniqueContentTypeIds = [
    ...new Set(Object.values(entryMap).map((e) => e.sys.contentType.sys.id)),
  ].filter((id) => !contentTypeMap[id]);

  if (uniqueContentTypeIds.length > 0) {
    const contentTypesResponse = await cma.contentType.getMany({
      query: { 'sys.id[in]': uniqueContentTypeIds.join(',') },
    });
    for (const ct of contentTypesResponse.items) {
      contentTypeMap[ct.sys.id] = ct;
    }
  }

  return contentTypeMap;
};
