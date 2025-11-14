export type Override = {
  id: string;
  fieldId: string;
  contentTypeId: string;
};

export type AppInstallationParameters = {
  overrides: Override[];
  separator: string;
  sourceFieldId: string;
};
