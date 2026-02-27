import { ContentTypeProps, EntryProps } from 'contentful-management';

export type AdoptedFieldsMap = Record<string, Record<string, boolean>>;

export interface ReferencedEntryData {
  entry: EntryProps;
  contentType: ContentTypeProps;
  fieldId: string;
  fieldName: string;
  isSelfReference: boolean;
}

export function hasAnyAdoptedFields(adoptedFieldsMap: AdoptedFieldsMap): boolean {
  return Object.values(adoptedFieldsMap).some((entryFields) =>
    Object.values(entryFields).some((adopted) => adopted)
  );
}

export function getEntryAdoptedFields(
  adoptedFieldsMap: AdoptedFieldsMap,
  entryId: string
): Record<string, boolean> {
  return adoptedFieldsMap[entryId] || {};
}

export function setFieldAdopted(
  adoptedFieldsMap: AdoptedFieldsMap,
  entryId: string,
  fieldId: string,
  adopted: boolean
): AdoptedFieldsMap {
  return {
    ...adoptedFieldsMap,
    [entryId]: {
      ...adoptedFieldsMap[entryId],
      [fieldId]: adopted,
    },
  };
}

export function setAllEntryFieldsAdopted(
  adoptedFieldsMap: AdoptedFieldsMap,
  entryId: string,
  fieldIds: string[],
  adopted: boolean
): AdoptedFieldsMap {
  const entryFields: Record<string, boolean> = {};
  fieldIds.forEach((fieldId) => {
    entryFields[fieldId] = adopted;
  });
  return {
    ...adoptedFieldsMap,
    [entryId]: entryFields,
  };
}
