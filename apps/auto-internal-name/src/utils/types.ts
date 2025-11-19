export type Override = {
  id: string;
  contentTypeId: string;
  fieldId: string;
};

export type AutocompleteItem = {
  id: string;
  name: string;
};

export type AppInstallationParameters = {
  overrides: Override[];
  separator: string;
  sourceFieldId: string;
};

export type OverrideIsInvalid = {
  isContentTypeMissing: boolean;
  isFieldMissing: boolean;
};
