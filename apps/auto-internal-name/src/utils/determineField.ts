import { AppInstallationParameters } from './types';

export const determineField = (
  contentTypeId: string,
  config: AppInstallationParameters
): string => {
  const override = config.overrides.find((override) => override.contentTypeId === contentTypeId);
  let fieldId = config.sourceFieldId;
  if (contentTypeId && override) {
    fieldId = override.fieldId;
  }
  return fieldId;
};
