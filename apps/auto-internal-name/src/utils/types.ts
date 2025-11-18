export type Override = {
  id: string;
  contentTypeId: string;
  fieldId: string;
};

export type AutocompleteItem = {
  id: string;
  name: string;
};

export type OverrideError = {
  isContentTypeMissing: boolean;
  isFieldMissing: boolean;
};
