export type Override = {
  id: string;
  fieldName: string;
  contentTypeId: string;
};
export type AppInstallationParameters = {
  overrides: Override[];
  separator: string;
  sourceFieldId: string;
};
