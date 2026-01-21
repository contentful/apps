export type FieldSelection = {
  fieldUniqueId: string;
  fieldId: string;
  fieldName: string;
  contentTypeId: string;
  contentTypeName: string;
  displayName: string;
};

export type Rule = {
  id: string;
  parentField: FieldSelection | null;
  referenceField: FieldSelection | null;
};

export type AppInstallationParameters = {
  rules: Rule[];
  separator: string;
};

export type RuleValidation = {
  parentFieldError: boolean;
  referenceFieldError: boolean;
  parentFieldErrorMessage: string;
  referenceFieldErrorMessage: string;
};

export type RuleValidationState = Record<string, RuleValidation>;
